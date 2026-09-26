/**
 * Transactions → positions.
 *
 * The trade log is the source of truth and is never mutated; positions are
 * recomputed on every read. That keeps cost basis auditable — a wrong entry is
 * fixed by appending a correction, not by overwriting a balance nobody can
 * reconstruct afterwards.
 *
 * Pure functions, no DB, no formatting. This is the money math, so it is
 * unit-tested to the edge cases that actually occur: partial sells, splits,
 * selling more than you hold, and positions closed to zero.
 *
 * Cost basis method: **average cost**. FIFO/specific-lot is more accurate for
 * tax reporting but needs per-lot tracking; average cost is what a long-term
 * holding view wants and is the convention most retail brokers display.
 * Revisit if tax lots ever matter.
 */

export type TransactionKind = 'buy' | 'sell' | 'dividend' | 'split'

export interface Transaction {
  id: string
  symbol: string
  kind: TransactionKind
  /** For `split`, this is the ratio (2 = 2-for-1), not a share count. */
  quantity: number
  pricePerShare: number
  fees: number
  tradedAt: Date
  /** When the entry was recorded. Orders same-day trades in entry order —
   *  Firestore ids are random, so they cannot carry that order themselves. */
  createdAt?: Date
}

export interface Position {
  symbol: string
  quantity: number
  /** Total cost of the shares still held, fees included. */
  costBasis: number
  /** costBasis ÷ quantity. Null once the position is fully closed. */
  averageCost: number | null
  realizedGain: number
  dividendIncome: number
  /** Chronologically first buy — the "held since" date. */
  openedAt: Date
  /** True when quantity has gone to zero but history remains. */
  closed: boolean
}

export interface PositionWithMarket extends Position {
  price: number | null
  marketValue: number | null
  unrealizedGain: number | null
  unrealizedGainPct: number | null
  /** Realized + unrealized + dividends, against money actually put in. */
  totalReturn: number | null
  /** Share of portfolio market value. Null when the total is unknown. */
  weight: number | null
}

export interface PortfolioSummary {
  positions: PositionWithMarket[]
  totalMarketValue: number
  totalCostBasis: number
  totalUnrealizedGain: number
  totalRealizedGain: number
  totalDividendIncome: number
  /** Null when no position has a price — a 0% return would be a lie. */
  totalReturnPct: number | null
  /** Positions we hold but have no quote for; their value is excluded. */
  unpricedSymbols: string[]
  warnings: string[]
}

/** Quantities below this are treated as a fully closed position rather than
 *  floating-point residue like 1e-15 shares. */
const DUST = 1e-9

/**
 * Replays the trade log in chronological order.
 *
 * Order matters and is not guaranteed by the caller's query, so it is enforced
 * here: selling before buying would otherwise produce a negative basis that
 * silently poisons every downstream number.
 */
export function derivePositions(transactions: Transaction[]): {
  positions: Position[]
  warnings: string[]
} {
  const warnings: string[] = []

  const ordered = [...transactions].sort((a, b) => {
    const byTime = a.tradedAt.getTime() - b.tradedAt.getTime()
    if (byTime !== 0) return byTime
    // Same timestamp: replay in entry order, then by id, so the result is
    // deterministic however the rows came back.
    const byEntry = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
    if (byEntry !== 0) return byEntry
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })

  const bySymbol = new Map<string, Position>()

  for (const tx of ordered) {
    const symbol = tx.symbol.toUpperCase()

    let position = bySymbol.get(symbol)
    if (!position) {
      position = {
        symbol,
        quantity: 0,
        costBasis: 0,
        averageCost: null,
        realizedGain: 0,
        dividendIncome: 0,
        openedAt: tx.tradedAt,
        closed: false,
      }
      bySymbol.set(symbol, position)
    }

    switch (tx.kind) {
      case 'buy': {
        // Fees are capitalised into the basis — they are part of what the
        // shares cost, and excluding them overstates every future gain.
        position.quantity += tx.quantity
        position.costBasis += tx.quantity * tx.pricePerShare + tx.fees
        break
      }

      case 'sell': {
        if (tx.quantity > position.quantity + DUST) {
          warnings.push(
            `${symbol}: sold ${tx.quantity} shares on ${tx.tradedAt.toISOString().slice(0, 10)} but only ${position.quantity} were held. Recorded the sale of what was held; check for a missing buy.`,
          )
        }

        const sold = Math.min(tx.quantity, position.quantity)
        const avgCost = position.quantity > 0 ? position.costBasis / position.quantity : 0

        const proceeds = sold * tx.pricePerShare - tx.fees
        position.realizedGain += proceeds - avgCost * sold

        position.quantity -= sold
        // Reduce basis by the average cost of what left, not by the sale price.
        position.costBasis -= avgCost * sold
        break
      }

      case 'dividend': {
        // Dividends do not touch quantity or basis; they are separate income.
        // Folding them into realized gain would misstate the cost of the shares.
        position.dividendIncome += tx.quantity * tx.pricePerShare - tx.fees
        break
      }

      case 'split': {
        const ratio = tx.quantity
        if (ratio <= 0) {
          warnings.push(`${symbol}: ignored a split with a non-positive ratio (${ratio}).`)
          break
        }
        // Share count scales, total basis does not — a split creates no value.
        position.quantity *= ratio
        break
      }
    }

    if (position.quantity <= DUST) {
      position.quantity = 0
      // Residual basis after a full exit is rounding noise; clear it so a
      // closed position does not report a phantom cost.
      position.costBasis = 0
      position.closed = true
      position.averageCost = null
    } else {
      position.closed = false
      position.averageCost = position.costBasis / position.quantity
    }
  }

  return { positions: [...bySymbol.values()], warnings }
}

/**
 * Attaches market prices and portfolio weights.
 *
 * `prices` maps symbol → latest close. A symbol missing from the map keeps a
 * null market value and is reported in `unpricedSymbols` rather than being
 * counted as zero, which would understate the portfolio without saying so.
 */
export function summarisePortfolio(
  transactions: Transaction[],
  prices: Map<string, number | null>,
  options: { includeClosed?: boolean } = {},
): PortfolioSummary {
  const { positions, warnings } = derivePositions(transactions)

  const visible = options.includeClosed ? positions : positions.filter((p) => !p.closed)

  const unpricedSymbols: string[] = []

  const priced = visible.map((position) => {
    const price = prices.get(position.symbol) ?? null

    if (price == null && !position.closed) unpricedSymbols.push(position.symbol)

    const marketValue = price == null ? null : position.quantity * price
    const unrealizedGain = marketValue == null ? null : marketValue - position.costBasis

    return {
      ...position,
      price,
      marketValue,
      unrealizedGain,
      unrealizedGainPct:
        unrealizedGain == null || position.costBasis === 0
          ? null
          : unrealizedGain / position.costBasis,
      totalReturn:
        unrealizedGain == null
          ? null
          : unrealizedGain + position.realizedGain + position.dividendIncome,
      weight: null as number | null,
    }
  })

  const totalMarketValue = priced.reduce((sum, p) => sum + (p.marketValue ?? 0), 0)
  const totalCostBasis = priced.reduce((sum, p) => sum + p.costBasis, 0)
  const totalUnrealizedGain = priced.reduce((sum, p) => sum + (p.unrealizedGain ?? 0), 0)

  // Realized and dividend totals come from ALL positions, including closed
  // ones — a stock you sold at a profit last year is still part of the result.
  const totalRealizedGain = positions.reduce((sum, p) => sum + p.realizedGain, 0)
  const totalDividendIncome = positions.reduce((sum, p) => sum + p.dividendIncome, 0)

  for (const p of priced) {
    p.weight = p.marketValue == null || totalMarketValue === 0 ? null : p.marketValue / totalMarketValue
  }

  priced.sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))

  const anyPriced = priced.some((p) => p.marketValue != null)

  return {
    positions: priced,
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedGain,
    totalRealizedGain,
    totalDividendIncome,
    totalReturnPct:
      !anyPriced || totalCostBasis === 0
        ? null
        : (totalUnrealizedGain + totalRealizedGain + totalDividendIncome) / totalCostBasis,
    unpricedSymbols,
    warnings,
  }
}
