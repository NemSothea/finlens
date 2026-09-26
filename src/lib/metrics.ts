/**
 * Derived ratios. Pure functions over statement rows — no DB, no formatting.
 *
 * Every ratio returns `null` rather than `Infinity`, `NaN` or `0` when its
 * inputs are missing or the denominator is zero. A `0%` margin and an unknown
 * margin are different facts, and collapsing them into the same pixel is how a
 * research tool loses the user's trust.
 */

export interface StatementLike {
  revenue: number | null
  grossProfit: number | null
  operatingIncome: number | null
  ebitda: number | null
  netIncome: number | null
  totalAssets: number | null
  totalEquity: number | null
  totalDebt: number | null
  totalCurrentAssets: number | null
  totalCurrentLiabilities: number | null
  operatingCashFlow: number | null
  freeCashFlow: number | null
  sharesDiluted: number | null
}

export interface DerivedMetrics {
  grossMargin: number | null
  operatingMargin: number | null
  netMargin: number | null
  fcfMargin: number | null
  returnOnEquity: number | null
  returnOnAssets: number | null
  currentRatio: number | null
  debtToEquity: number | null
  netDebt: number | null
}

/** Safe division: null unless both sides are finite and the denominator is non-zero. */
export function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null) return null
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) return null
  return numerator / denominator
}

export function deriveMetrics(s: StatementLike, cash?: number | null): DerivedMetrics {
  return {
    grossMargin: ratio(s.grossProfit, s.revenue),
    operatingMargin: ratio(s.operatingIncome, s.revenue),
    netMargin: ratio(s.netIncome, s.revenue),
    fcfMargin: ratio(s.freeCashFlow, s.revenue),
    returnOnEquity: ratio(s.netIncome, s.totalEquity),
    returnOnAssets: ratio(s.netIncome, s.totalAssets),
    currentRatio: ratio(s.totalCurrentAssets, s.totalCurrentLiabilities),
    debtToEquity: ratio(s.totalDebt, s.totalEquity),
    netDebt: s.totalDebt == null ? null : s.totalDebt - (cash ?? 0),
  }
}

/**
 * Compound annual growth rate between the oldest and newest value in a series
 * ordered NEWEST FIRST (the order every query in this app returns).
 *
 * Returns null when either endpoint is non-positive: CAGR across a sign change
 * is arithmetically defined but financially meaningless, and printing it would
 * be worse than printing nothing.
 */
export function cagr(seriesNewestFirst: Array<number | null>): number | null {
  const usable = seriesNewestFirst.filter((v): v is number => v != null && isFinite(v))
  if (usable.length < 2) return null

  const newest = usable[0]
  const oldest = usable[usable.length - 1]
  const periods = usable.length - 1

  if (newest <= 0 || oldest <= 0) return null

  return (newest / oldest) ** (1 / periods) - 1
}

/** Year-over-year change, series ordered newest first. */
export function yoyGrowth(seriesNewestFirst: Array<number | null>): number | null {
  const [newest, previous] = seriesNewestFirst
  if (newest == null || previous == null || previous === 0) return null
  // Sign flip makes the percentage nonsense (a swing from -100 to +50 is not "-150%").
  if (previous < 0) return null
  return (newest - previous) / previous
}
