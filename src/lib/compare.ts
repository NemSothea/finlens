import type { FundamentalPoint } from '@/lib/fundamentals'

/**
 * Pure helpers for the compare page: which value is "better", and how to put
 * two companies with different fiscal calendars on one time axis.
 */

export type Better = 'higher' | 'lower'

/**
 * Index of the best value, or null when fewer than two values are known or the
 * best is tied. A "winner" against a missing number is not a comparison.
 */
export function pickWinner(values: Array<number | null>, better: Better): number | null {
  const known = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null && isFinite(x.v))
  if (known.length < 2) return null

  const sorted = [...known].sort((a, b) => (better === 'higher' ? b.v - a.v : a.v - b.v))
  if (sorted[0].v === sorted[1].v) return null
  return sorted[0].i
}

/**
 * Calendar bucket for a reporting period, by the period's MIDPOINT. NVDA's
 * fiscal 2026 ends in January 2026 but is almost entirely calendar 2025;
 * labelling bars by fiscal year would put it beside Apple's fiscal 2026 and
 * compare different twelve months. Midpoint = end − 182 days (year) or − 45
 * days (quarter).
 */
export function calendarBucket(periodEnd: string, kind: 'year' | 'quarter'): string {
  const d = new Date(`${periodEnd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - (kind === 'year' ? 182 : 45))
  const y = d.getUTCFullYear()
  return kind === 'year' ? `CY${y}` : `${y} Q${Math.floor(d.getUTCMonth() / 3) + 1}`
}

export type AlignedRow = { x: string } & Record<string, number | string | null>

/**
 * One row per calendar bucket, one column per symbol. A company without a
 * period in that bucket gets null (a gap), never a neighbour's value.
 */
export function alignByCalendar(
  companies: Array<{ symbol: string; points: FundamentalPoint[] }>,
  metric: Exclude<keyof FundamentalPoint, 'label' | 'periodEnd'>,
  kind: 'year' | 'quarter',
): AlignedRow[] {
  const rows = new Map<string, AlignedRow>()
  for (const c of companies) {
    for (const p of c.points) {
      const x = calendarBucket(p.periodEnd, kind)
      const row = rows.get(x) ?? ({ x } as AlignedRow)
      row[c.symbol] = p[metric]
      rows.set(x, row)
    }
  }
  const symbols = companies.map((c) => c.symbol)
  return [...rows.values()]
    .map((r) => {
      for (const s of symbols) if (!(s in r)) r[s] = null
      return r
    })
    .sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0))
}

/**
 * Prices rebased to 100 at the first date every company traded, so a $170
 * stock and a $530 stock share one axis without a second y-scale. Only dates
 * on which all companies have a close are kept.
 */
export function indexPrices(
  companies: Array<{ symbol: string; bars: Array<{ tradeDate: string; close: number }> }>,
): Array<{ tradeDate: string } & Record<string, number | string>> {
  if (companies.length === 0) return []
  const maps = companies.map((c) => new Map(c.bars.map((b) => [b.tradeDate, b.close])))
  const dates = [...maps[0].keys()].filter((d) => maps.every((m) => m.has(d))).sort()
  if (dates.length === 0) return []

  const base = maps.map((m) => m.get(dates[0]) as number)
  if (base.some((b) => !(b > 0))) return []

  return dates.map((tradeDate) => {
    const row: { tradeDate: string } & Record<string, number | string> = { tradeDate }
    companies.forEach((c, i) => {
      row[c.symbol] = ((maps[i].get(tradeDate) as number) / base[i]) * 100
    })
    return row
  })
}
