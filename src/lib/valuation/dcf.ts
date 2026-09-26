/**
 * Two-stage discounted cash flow.
 *
 * Pure functions, no I/O, no DB. This is the feature users pay for, so it has
 * to be unit-testable and inspectable — every intermediate number is returned,
 * not just the final answer. A fair value nobody can explain is worthless.
 *
 * Deliberately NOT auto-fitted: growth and discount rate stay user inputs with
 * documented defaults. Regressing them from history produces numbers that look
 * authoritative and are not.
 */

export interface DcfAssumptions {
  /** Starting free cash flow (normalised, e.g. 3yr average). Absolute currency. */
  baseFreeCashFlow: number
  sharesOutstanding: number
  /** totalDebt - cash. Negative for net-cash companies. */
  netDebt: number
  /** Stage-1 annual FCF growth, decimal (0.10 = 10%). */
  growthRate: number
  /** Explicit forecast horizon in years. */
  growthYears: number
  /** Perpetual growth after the horizon. Must stay below discountRate. */
  terminalGrowthRate: number
  /** Required return / WACC, decimal. */
  discountRate: number
  /**
   * Linearly fade stage-1 growth toward terminal growth across the horizon.
   * On by default: a company does not compound at 20% for ten years and then
   * drop to 2.5% overnight, and the cliff version overstates value badly.
   */
  fade?: boolean
}

export interface DcfYear {
  year: number
  growthRate: number
  freeCashFlow: number
  discountFactor: number
  presentValue: number
}

export interface DcfResult {
  fairValuePerShare: number
  equityValue: number
  enterpriseValue: number
  pvOfForecast: number
  pvOfTerminalValue: number
  terminalValue: number
  /** Share of total value coming from the terminal value. Above ~0.75 the
   *  answer is really a bet on the terminal assumption, not on the forecast. */
  terminalValueShare: number
  years: DcfYear[]
  assumptions: Required<DcfAssumptions>
}

export const DEFAULT_ASSUMPTIONS = {
  growthRate: 0.08,
  growthYears: 10,
  terminalGrowthRate: 0.025,
  discountRate: 0.1,
  fade: true,
} as const

export function calculateDcf(input: DcfAssumptions): DcfResult {
  const a: Required<DcfAssumptions> = { fade: DEFAULT_ASSUMPTIONS.fade, ...input }

  validate(a)

  const years: DcfYear[] = []
  let fcf = a.baseFreeCashFlow
  let pvOfForecast = 0

  for (let y = 1; y <= a.growthYears; y++) {
    // Fade interpolates growth toward terminal across the horizon so the
    // handoff to the perpetuity is continuous rather than a cliff.
    const g = a.fade
      ? a.growthRate + ((a.terminalGrowthRate - a.growthRate) * (y - 1)) / Math.max(1, a.growthYears - 1)
      : a.growthRate

    fcf = fcf * (1 + g)
    const discountFactor = 1 / (1 + a.discountRate) ** y
    const presentValue = fcf * discountFactor
    pvOfForecast += presentValue

    years.push({ year: y, growthRate: g, freeCashFlow: fcf, discountFactor, presentValue })
  }

  // Gordon growth on the final forecast year's cash flow.
  const terminalValue = (fcf * (1 + a.terminalGrowthRate)) / (a.discountRate - a.terminalGrowthRate)
  const pvOfTerminalValue = terminalValue / (1 + a.discountRate) ** a.growthYears

  const enterpriseValue = pvOfForecast + pvOfTerminalValue
  const equityValue = enterpriseValue - a.netDebt
  const fairValuePerShare = equityValue / a.sharesOutstanding

  return {
    fairValuePerShare,
    equityValue,
    enterpriseValue,
    pvOfForecast,
    pvOfTerminalValue,
    terminalValue,
    terminalValueShare: enterpriseValue === 0 ? 0 : pvOfTerminalValue / enterpriseValue,
    years,
    assumptions: a,
  }
}

/**
 * Margin of safety: how far the current price sits below fair value.
 * Positive = trading at a discount. Returns a decimal (0.25 = 25% below).
 */
export function marginOfSafety(fairValuePerShare: number, currentPrice: number): number {
  if (!isFinite(fairValuePerShare) || fairValuePerShare <= 0 || currentPrice <= 0) return Number.NaN
  return (fairValuePerShare - currentPrice) / fairValuePerShare
}

export interface ReverseDcfInput extends Omit<DcfAssumptions, 'growthRate'> {
  /** The market price we are solving against. */
  currentPrice: number
}

export interface ReverseDcfResult {
  impliedGrowthRate: number
  converged: boolean
  iterations: number
}

/**
 * Reverse DCF — solve for the stage-1 growth rate that makes fair value equal
 * the current price. Reframes "is this cheap?" (unanswerable) into "is this
 * growth assumption believable?" (answerable), which is the more honest
 * question and the harder one for a competitor to fake.
 *
 * Bisection rather than Newton: the function is monotonic in growth over the
 * bracket, and bisection cannot diverge on the pathological inputs real
 * tickers produce (negative FCF, tiny share counts, net-cash balance sheets).
 */
export function reverseDcf(input: ReverseDcfInput, maxIterations = 200): ReverseDcfResult {
  const { currentPrice, ...rest } = input

  const priceAt = (growthRate: number) =>
    calculateDcf({ ...rest, growthRate }).fairValuePerShare - currentPrice

  let lo = -0.5 // -50% annual decline
  let hi = 1.0 // +100% annual growth

  let fLo = priceAt(lo)
  let fHi = priceAt(hi)

  // No sign change means the price is unreachable anywhere in the bracket —
  // report the nearer bound instead of pretending to a precise answer.
  if (fLo > 0 === fHi > 0) {
    return {
      impliedGrowthRate: Math.abs(fLo) < Math.abs(fHi) ? lo : hi,
      converged: false,
      iterations: 0,
    }
  }

  let mid = lo
  let i = 0

  for (; i < maxIterations; i++) {
    mid = (lo + hi) / 2
    const fMid = priceAt(mid)

    if (Math.abs(fMid) < 1e-6 || hi - lo < 1e-7) break

    if (fMid > 0 === fLo > 0) {
      lo = mid
      fLo = fMid
    } else {
      hi = mid
      fHi = fMid
    }
  }

  return { impliedGrowthRate: mid, converged: true, iterations: i }
}

/**
 * Normalise the FCF starting point by averaging recent years. A single year is
 * noisy — one heavy capex cycle or working-capital swing distorts the entire
 * valuation because every projected year scales off this number.
 */
export function normaliseFreeCashFlow(history: Array<number | null>, years = 3): number | null {
  const usable = history.filter((v): v is number => v != null && isFinite(v)).slice(0, years)
  if (usable.length === 0) return null
  return usable.reduce((sum, v) => sum + v, 0) / usable.length
}

function validate(a: Required<DcfAssumptions>): void {
  if (a.discountRate <= a.terminalGrowthRate) {
    // Gordon growth divides by (r - g); at r <= g the terminal value is
    // negative or infinite. Fail loudly rather than render nonsense.
    throw new RangeError(
      `discountRate (${a.discountRate}) must exceed terminalGrowthRate (${a.terminalGrowthRate})`,
    )
  }
  if (a.sharesOutstanding <= 0) {
    throw new RangeError(`sharesOutstanding must be positive, got ${a.sharesOutstanding}`)
  }
  if (!Number.isInteger(a.growthYears) || a.growthYears < 1) {
    throw new RangeError(`growthYears must be a positive integer, got ${a.growthYears}`)
  }
  if (!isFinite(a.baseFreeCashFlow)) {
    throw new RangeError('baseFreeCashFlow must be a finite number')
  }
}
