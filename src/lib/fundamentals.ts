import { ratio, trailingTwelveMonths, type QuarterRow } from '@/lib/metrics'

/**
 * Chart series for the stock page's fundamentals grid, in three period modes.
 * Pure: takes statement rows (newest first, as every query returns them) and
 * returns ASCENDING points, because charts read left-to-right in time.
 */

export type PeriodMode = 'quarterly' | 'ttm' | 'annual'

export interface FundamentalPoint {
  label: string
  periodEnd: string
  revenue: number | null
  ebitda: number | null
  netIncome: number | null
  epsDiluted: number | null
  operatingCashFlow: number | null
  freeCashFlow: number | null
  netMargin: number | null
}

export interface StatementSeriesRow extends QuarterRow {
  period: string
  fiscalYear: number
}

function point(label: string, r: QuarterRow): FundamentalPoint {
  return {
    label,
    periodEnd: r.periodEnd,
    revenue: r.revenue,
    ebitda: r.ebitda,
    netIncome: r.netIncome,
    epsDiluted: r.epsDiluted,
    operatingCashFlow: r.operatingCashFlow,
    freeCashFlow: r.freeCashFlow,
    netMargin: ratio(r.netIncome, r.revenue),
  }
}

/** Rolling TTM: one point per quarter that has three consecutive quarters behind it. */
export function rollingTtm(quartersNewestFirst: QuarterRow[]): FundamentalPoint[] {
  const out: FundamentalPoint[] = []
  for (let i = 0; i + 4 <= quartersNewestFirst.length; i++) {
    const ttm = trailingTwelveMonths(quartersNewestFirst.slice(i))
    if (ttm) out.push(point(`TTM ${ttm.periodEnd.slice(0, 7)}`, ttm))
  }
  return out.reverse()
}

export function buildFundamentalSeries(
  annualNewestFirst: StatementSeriesRow[],
  quartersNewestFirst: StatementSeriesRow[],
): Record<PeriodMode, FundamentalPoint[]> {
  return {
    // Fiscal labels, not calendar: NVDA's FY2026 ends in January 2026.
    annual: annualNewestFirst.map((r) => point(`FY${r.fiscalYear}`, r)).reverse(),
    quarterly: quartersNewestFirst
      .map((r) => point(`${r.period} FY${String(r.fiscalYear).slice(2)}`, r))
      .reverse(),
    ttm: rollingTtm(quartersNewestFirst),
  }
}

/** Keep points whose period ends within `years` of the newest one. `null` = all. */
export function withinYears<T extends { periodEnd?: string; tradeDate?: string }>(
  ascending: T[],
  years: number | null,
): T[] {
  if (years == null || ascending.length === 0) return ascending
  const dateOf = (p: T) => p.periodEnd ?? p.tradeDate ?? ''
  const last = new Date(`${dateOf(ascending[ascending.length - 1])}T00:00:00Z`)
  last.setUTCFullYear(last.getUTCFullYear() - years)
  const cutoff = last.toISOString().slice(0, 10)
  return ascending.filter((p) => dateOf(p) > cutoff)
}

/** Thin a long daily series to at most `max` points, always keeping the last. */
export function downsample<T>(ascending: T[], max: number): T[] {
  if (ascending.length <= max) return ascending
  const step = Math.ceil(ascending.length / max)
  const out = ascending.filter((_, i) => i % step === 0)
  if (out[out.length - 1] !== ascending[ascending.length - 1]) out.push(ascending[ascending.length - 1])
  return out
}
