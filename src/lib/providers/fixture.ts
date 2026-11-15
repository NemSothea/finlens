import type {
  CompanyProfile,
  FinancialPeriod,
  MarketDataProvider,
  PriceBar,
  Quote,
  SymbolRef,
} from './types'

/**
 * Deterministic offline provider.
 *
 * Exists so the pipeline, schema and valuation stage can be exercised end to
 * end before anyone pays a vendor, and so CI never depends on a third-party
 * API being up or a key being present. Generated numbers are internally
 * consistent (FCF ties to operating cash flow minus capex, debt ties to the
 * balance sheet) — inconsistent fixtures hide exactly the join bugs this is
 * meant to catch.
 *
 * Values are derived from a seeded hash of the symbol, so every run produces
 * identical data and test assertions stay stable.
 */
export class FixtureProvider implements MarketDataProvider {
  readonly name = 'fixture'

  private static readonly UNIVERSE: Array<{ symbol: string; name: string; exchange: string }> = [
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
    { symbol: 'KO', name: 'The Coca-Cola Company', exchange: 'NYSE' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
    { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ' },
  ]

  /** FNV-1a. Cheap, stable across runs and Node versions. */
  private seed(symbol: string): number {
    let h = 2166136261
    for (let i = 0; i < symbol.length; i++) {
      h ^= symbol.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return (h >>> 0) / 4294967295
  }

  async listSymbols(exchanges: string[]): Promise<SymbolRef[]> {
    const wanted = new Set(exchanges.map((e) => e.toUpperCase()))
    return FixtureProvider.UNIVERSE.filter(
      (s) => wanted.size === 0 || wanted.has(s.exchange),
    ).map((s) => ({ ...s }))
  }

  async getProfile(symbol: string): Promise<CompanyProfile | null> {
    const known = FixtureProvider.UNIVERSE.find((s) => s.symbol === symbol)
    const r = this.seed(symbol)

    return {
      symbol,
      name: known?.name ?? `${symbol} Holdings`,
      exchange: known?.exchange ?? 'NASDAQ',
      currency: 'USD',
      country: 'US',
      sector: ['Technology', 'Consumer Staples', 'Healthcare', 'Financials'][Math.floor(r * 4)],
      industry: 'Fixture Industry',
      website: `https://example.com/${symbol.toLowerCase()}`,
      description: `Synthetic fixture profile for ${symbol}. Not real data.`,
      ceo: 'Fixture CEO',
      employees: Math.round(1_000 + r * 200_000),
      ipoDate: '1990-01-01',
      beta: Math.round((0.7 + r * 0.9) * 100) / 100,
    }
  }

  async getAnnualFinancials(symbol: string, limit: number): Promise<FinancialPeriod[]> {
    const r = this.seed(symbol)
    const currentYear = 2025

    const baseRevenue = 5e9 + r * 3e11
    const growth = 0.04 + r * 0.12
    const netMargin = 0.06 + r * 0.22
    const shares = 5e8 + r * 1.2e10

    const out: FinancialPeriod[] = []

    for (let i = 0; i < Math.min(limit, 30); i++) {
      const fiscalYear = currentYear - i
      // Discount backwards so the newest year is the largest, like real history.
      const revenue = baseRevenue / (1 + growth) ** i
      const grossProfit = revenue * (0.35 + r * 0.3)
      const operatingIncome = revenue * (0.12 + r * 0.2)
      const ebitda = operatingIncome * 1.18
      const netIncome = revenue * netMargin
      const operatingCashFlow = netIncome * 1.25
      const capitalExpenditure = -revenue * (0.03 + r * 0.05)
      const dilutedShares = shares * (1 + i * 0.01) // buybacks shrink count over time
      const cash = revenue * (0.15 + r * 0.2)
      const totalDebt = revenue * (0.1 + r * 0.35)
      const totalAssets = revenue * (1.1 + r * 0.9)
      const totalLiabilities = totalAssets * (0.4 + r * 0.25)

      out.push({
        symbol,
        period: 'FY',
        fiscalYear,
        periodEnd: `${fiscalYear}-12-31`,
        reportedCurrency: 'USD',

        revenue,
        costOfRevenue: revenue - grossProfit,
        grossProfit,
        operatingExpenses: grossProfit - operatingIncome,
        operatingIncome,
        ebitda,
        interestExpense: totalDebt * 0.04,
        incomeTax: netIncome * 0.21,
        netIncome,
        eps: netIncome / dilutedShares,
        epsDiluted: netIncome / dilutedShares,
        sharesBasic: dilutedShares * 0.99,
        sharesDiluted: dilutedShares,

        cashAndEquivalents: cash,
        shortTermInvestments: cash * 0.4,
        inventory: revenue * 0.06,
        totalCurrentAssets: totalAssets * 0.4,
        totalAssets,
        totalCurrentLiabilities: totalLiabilities * 0.45,
        shortTermDebt: totalDebt * 0.2,
        longTermDebt: totalDebt * 0.8,
        totalDebt,
        totalLiabilities,
        totalEquity: totalAssets - totalLiabilities,

        operatingCashFlow,
        // capex is negative, matching vendor convention — the FCF derivation
        // in the real provider adds rather than subtracts, and this keeps the
        // fixture honest about that sign.
        capitalExpenditure,
        freeCashFlow: operatingCashFlow + capitalExpenditure,
        dividendsPaid: -netIncome * 0.2,
        shareBuybacks: -netIncome * 0.25,
      })
    }

    return out
  }

  async getQuarterlyFinancials(symbol: string, limit: number): Promise<FinancialPeriod[]> {
    const annual = await this.getAnnualFinancials(symbol, Math.ceil(limit / 4))
    const out: FinancialPeriod[] = []

    // Every flow line is a quarter of the year, so four quarters sum back to the
    // annual statement exactly — the property TTM depends on. Balance-sheet
    // lines are point-in-time and stay at the year-end value.
    const FLOW_KEYS = [
      'revenue',
      'costOfRevenue',
      'grossProfit',
      'operatingExpenses',
      'operatingIncome',
      'ebitda',
      'interestExpense',
      'incomeTax',
      'netIncome',
      'eps',
      'epsDiluted',
      'operatingCashFlow',
      'capitalExpenditure',
      'freeCashFlow',
      'dividendsPaid',
      'shareBuybacks',
    ] as const
    const QUARTER_END = { 1: '03-31', 2: '06-30', 3: '09-30', 4: '12-31' } as const

    for (const year of annual) {
      for (const q of [4, 3, 2, 1] as const) {
        if (out.length >= limit) return out
        const row: FinancialPeriod = {
          ...year,
          period: `Q${q}`,
          periodEnd: `${year.fiscalYear}-${QUARTER_END[q]}`,
        }
        for (const k of FLOW_KEYS) {
          const v = year[k]
          row[k] = v == null ? null : v / 4
        }
        out.push(row)
      }
    }
    return out
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return Promise.all(
      symbols.map(async (symbol) => {
        const r = this.seed(symbol)
        const [latest] = await this.getAnnualFinancials(symbol, 1)
        const shares = latest?.sharesDiluted ?? 1e9
        const netIncome = latest?.netIncome ?? 1e8
        const eps = netIncome / shares
        const pe = 12 + r * 30
        const price = eps * pe

        return {
          symbol,
          price,
          previousClose: price * (1 - (r - 0.5) * 0.02),
          dayChangePct: (r - 0.5) * 2,
          marketCap: price * shares,
          sharesOutstanding: shares,
          volume: 1e6 + r * 5e7,
          peRatio: pe,
          yearHigh: price * 1.3,
          yearLow: price * 0.7,
        }
      }),
    )
  }

  async getNextEarningsDate(symbol: string, today: string): Promise<string | null> {
    // Deterministic: 5–95 days out, from the symbol seed.
    const d = new Date(`${today}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + 5 + Math.floor(this.seed(symbol) * 90))
    return d.toISOString().slice(0, 10)
  }

  async getDailyPrices(symbol: string, from: string): Promise<PriceBar[]> {
    const [quote] = await this.getQuotes([symbol])
    const start = new Date(`${from}T00:00:00Z`)
    const today = new Date()
    const bars: PriceBar[] = []

    let price = (quote.price ?? 100) * 0.8
    const r = this.seed(symbol)

    for (let d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.getUTCDay()
      if (day === 0 || day === 6) continue // no weekend bars, same as a real feed

      // Deterministic pseudo-walk: day-of-epoch folded with the symbol seed.
      const t = Math.floor(d.getTime() / 86_400_000)
      const wiggle = Math.sin(t * (1 + r * 3)) * 0.015
      price = Math.max(0.01, price * (1 + wiggle + 0.0004))

      const iso = d.toISOString().slice(0, 10)
      bars.push({
        symbol,
        tradeDate: iso,
        open: price * 0.995,
        high: price * 1.012,
        low: price * 0.988,
        close: price,
        adjClose: price,
        volume: 1e6 + r * 1e7,
      })
    }

    return bars
  }
}
