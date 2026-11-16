/**
 * Beta from prices: the slope of the stock's monthly returns on the market's.
 *
 *   beta = cov(stock, market) / var(market)
 *
 * Monthly returns over the last five years against the S&P 500 (SPY) — the
 * convention most data vendors use, so a computed beta lands near the one a
 * user sees elsewhere. Monthly rather than daily: daily returns of thinly
 * traded or foreign-listed stocks lag the market and bias beta toward zero.
 *
 * Pure: takes closes, returns a number or null. No I/O.
 */

export interface Close {
  /** ISO date. */
  date: string
  close: number
}

/** Need two years of overlap at least; fewer points make beta mostly noise. */
export const MIN_MONTHS = 24
export const LOOKBACK_MONTHS = 60

/** Last close of each calendar month, keyed "YYYY-MM". Input in any order. */
export function monthEndCloses(bars: Close[]): Map<string, number> {
  const out = new Map<string, { date: string; close: number }>()
  for (const b of bars) {
    if (!(b.close > 0)) continue
    const month = b.date.slice(0, 7)
    const prev = out.get(month)
    if (!prev || b.date > prev.date) out.set(month, b)
  }
  return new Map([...out].map(([m, b]) => [m, b.close]))
}

function monthlyReturns(closes: Map<string, number>, months: string[]): Map<string, number> {
  const out = new Map<string, number>()
  for (let i = 1; i < months.length; i++) {
    const a = closes.get(months[i - 1])
    const b = closes.get(months[i])
    if (a != null && b != null) out.set(months[i], b / a - 1)
  }
  return out
}

export function betaFromCloses(stock: Close[], market: Close[] | Map<string, number>): number | null {
  const s = monthEndCloses(stock)
  const m = market instanceof Map ? market : monthEndCloses(market)

  // Months both series have, newest LOOKBACK_MONTHS + 1 of them. The current,
  // unfinished month is dropped: its "month-end" is just today's close.
  const thisMonth = new Date().toISOString().slice(0, 7)
  const months = [...s.keys()]
    .filter((k) => m.has(k) && k < thisMonth)
    .sort()
    .slice(-(LOOKBACK_MONTHS + 1))

  const rs = monthlyReturns(s, months)
  const rm = monthlyReturns(m, months)
  const paired = [...rs.keys()].filter((k) => rm.has(k)).map((k) => [rs.get(k)!, rm.get(k)!] as const)
  if (paired.length < MIN_MONTHS) return null

  const meanS = paired.reduce((a, [x]) => a + x, 0) / paired.length
  const meanM = paired.reduce((a, [, y]) => a + y, 0) / paired.length
  let cov = 0
  let varM = 0
  for (const [x, y] of paired) {
    cov += (x - meanS) * (y - meanM)
    varM += (y - meanM) ** 2
  }
  if (varM === 0) return null
  return Math.round((cov / varM) * 1000) / 1000
}
