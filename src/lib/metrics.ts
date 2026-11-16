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
  /** Optional: only needed for ROIC's effective tax rate. */
  incomeTax?: number | null
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
  returnOnInvestedCapital: number | null
}

/** Safe division: null unless both sides are finite and the denominator is non-zero. */
export function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null) return null
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) return null
  return numerator / denominator
}

/**
 * Cash a company could use to pay down debt tomorrow: cash and equivalents plus
 * short-term investments. Used for net debt everywhere (metrics card, compare,
 * DCF) so the same company never shows two different net-debt figures.
 */
export function liquidCash(
  cashAndEquivalents: number | null | undefined,
  shortTermInvestments: number | null | undefined,
): number | null {
  if (cashAndEquivalents == null && shortTermInvestments == null) return null
  return (cashAndEquivalents ?? 0) + (shortTermInvestments ?? 0)
}

/**
 * Return on invested capital: NOPAT ÷ (debt + equity − liquid cash).
 * NOPAT = operating income × (1 − effective tax rate), where the tax rate is
 * income tax ÷ pre-tax income (approximated as net income + income tax).
 * Null rather than a guessed 21% when the tax line is missing.
 */
export function returnOnInvestedCapital(s: StatementLike, cash?: number | null): number | null {
  if (s.operatingIncome == null || s.incomeTax == null || s.netIncome == null) return null
  if (s.totalDebt == null || s.totalEquity == null) return null
  const pretax = s.netIncome + s.incomeTax
  if (pretax <= 0) return null
  const taxRate = Math.min(Math.max(s.incomeTax / pretax, 0), 0.5)
  const invested = s.totalDebt + s.totalEquity - (cash ?? 0)
  if (invested <= 0) return null
  return ratio(s.operatingIncome * (1 - taxRate), invested)
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
    returnOnInvestedCapital: returnOnInvestedCapital(s, cash),
  }
}

/** Price ÷ trailing diluted EPS. Null for losses — a negative P/E is not a multiple. */
export function priceToEarnings(price: number | null, epsDiluted: number | null): number | null {
  if (price == null || epsDiluted == null || epsDiluted <= 0) return null
  return ratio(price, epsDiluted)
}

/* ------------------------------------------------------------------ *
 * Trailing twelve months
 * ------------------------------------------------------------------ */

/** Income-statement and cash-flow lines: summed over four quarters. */
export const TTM_FLOW_KEYS = [
  'revenue',
  'grossProfit',
  'operatingIncome',
  'ebitda',
  'interestExpense',
  'netIncome',
  'incomeTax',
  'eps',
  'epsDiluted',
  'operatingCashFlow',
  'capitalExpenditure',
  'freeCashFlow',
] as const

/** Balance-sheet lines (and share count): taken from the latest quarter. */
export const TTM_STOCK_KEYS = [
  'sharesDiluted',
  'totalAssets',
  'totalEquity',
  'totalDebt',
  'totalCurrentAssets',
  'totalCurrentLiabilities',
  'cashAndEquivalents',
  'shortTermInvestments',
] as const

type TtmKey = (typeof TTM_FLOW_KEYS)[number] | (typeof TTM_STOCK_KEYS)[number]
export type QuarterRow = { periodEnd: string } & Record<TtmKey, number | null>
export type TtmRow = QuarterRow

const DAY = 86_400_000

/**
 * Trailing twelve months from quarterly rows ordered NEWEST FIRST.
 *
 * Returns null unless the four newest quarters are consecutive (each about 3
 * months apart). A gap means a missing filing, and summing three quarters plus
 * one from last year would silently understate every flow by a quarter.
 * A flow line is null unless all four quarters report it, for the same reason.
 */
export function trailingTwelveMonths(quartersNewestFirst: QuarterRow[]): TtmRow | null {
  const q = quartersNewestFirst.slice(0, 4)
  if (q.length < 4) return null

  for (let i = 0; i < 3; i++) {
    const gapDays = (Date.parse(q[i].periodEnd) - Date.parse(q[i + 1].periodEnd)) / DAY
    // 75–120 days: 13-week quarters, plus retail calendars like Costco's
    // three 12-week quarters and a 16-week fourth (112 days).
    if (!(gapDays >= 75 && gapDays <= 120)) return null
  }

  const out = { periodEnd: q[0].periodEnd } as TtmRow
  for (const k of TTM_FLOW_KEYS) {
    const values = q.map((row) => row[k])
    out[k] = values.every((v): v is number => v != null && isFinite(v))
      ? values.reduce((a, b) => a + b, 0)
      : null
  }
  for (const k of TTM_STOCK_KEYS) out[k] = q[0][k]
  return out
}

/* ------------------------------------------------------------------ *
 * Growth over a measured span
 * ------------------------------------------------------------------ */

/**
 * CAGR between the newest value and the oldest value no more than `maxYears`
 * fiscal years earlier, with the span measured from fiscal years rather than
 * row count. Returns the span actually used so a label can say "4y" when only
 * four years of history exist, instead of claiming five.
 */
export function cagrOverYears(
  rowsNewestFirst: Array<{ fiscalYear: number; value: number | null }>,
  maxYears: number,
): { value: number | null; years: number } {
  const usable = rowsNewestFirst.filter(
    (r): r is { fiscalYear: number; value: number } => r.value != null && isFinite(r.value),
  )
  if (usable.length < 2) return { value: null, years: 0 }

  const newest = usable[0]
  const window = usable.filter((r) => r.fiscalYear >= newest.fiscalYear - maxYears)
  const oldest = window[window.length - 1]
  const years = newest.fiscalYear - oldest.fiscalYear
  if (years <= 0) return { value: null, years: 0 }
  if (newest.value <= 0 || oldest.value <= 0) return { value: null, years }

  return { value: (newest.value / oldest.value) ** (1 / years) - 1, years }
}

/* ------------------------------------------------------------------ *
 * Share price returns
 * ------------------------------------------------------------------ */

export interface PriceReturns {
  asOf: string | null
  ytd: number | null
  oneYear: number | null
  fiveYear: number | null
  /** Annualised equivalent of `fiveYear`. */
  fiveYearCagr: number | null
}

/** Last close on or before `date` (ISO). Bars must be ASCENDING by date. */
function closeOnOrBefore(bars: Array<{ tradeDate: string; close: number }>, date: string) {
  let lo = 0
  let hi = bars.length - 1
  let found: number | null = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (bars[mid].tradeDate <= date) {
      found = bars[mid].close
      lo = mid + 1
    } else hi = mid - 1
  }
  return found
}

function shiftYears(iso: string, years: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCFullYear(d.getUTCFullYear() - years)
  return d.toISOString().slice(0, 10)
}

/**
 * Price returns from daily bars ordered ASCENDING. A return is null when the
 * history does not reach back to its start date — a "5y" figure computed from
 * three years of bars would be a lie with a confident label.
 */
export function priceReturns(barsAscending: Array<{ tradeDate: string; close: number }>): PriceReturns {
  const empty = { asOf: null, ytd: null, oneYear: null, fiveYear: null, fiveYearCagr: null }
  if (barsAscending.length === 0) return empty

  const first = barsAscending[0].tradeDate
  const last = barsAscending[barsAscending.length - 1]
  const change = (startDate: string) => {
    if (startDate < first) return null
    const base = closeOnOrBefore(barsAscending, startDate)
    return base == null || base <= 0 ? null : last.close / base - 1
  }

  const yearEnd = `${Number(last.tradeDate.slice(0, 4)) - 1}-12-31`
  const fiveYear = change(shiftYears(last.tradeDate, 5))

  return {
    asOf: last.tradeDate,
    ytd: change(yearEnd),
    oneYear: change(shiftYears(last.tradeDate, 1)),
    fiveYear,
    fiveYearCagr: fiveYear == null || fiveYear <= -1 ? null : (1 + fiveYear) ** (1 / 5) - 1,
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
