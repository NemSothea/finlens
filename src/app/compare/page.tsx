import { Fragment } from 'react'
import Link from 'next/link'
import { SectionHeading } from '@/components/metric-card'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { ComparePicker } from '@/components/compare-picker'
import { CompareCharts, type CompareCompany } from '@/components/compare-charts'
import { getCurrentEntitlement } from '@/lib/queries/billing'
import { PRO_LIMITS } from '@/lib/billing/entitlements'
import { getPriceSeries, getSnapshots, getStatements, type StockSnapshot } from '@/lib/queries/stocks'
import { buildFundamentalSeries } from '@/lib/fundamentals'
import { pickWinner, type Better } from '@/lib/compare'
import {
  formatCurrencyCompact,
  formatMultiple,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  MISSING,
} from '@/lib/format'
import { Reveal } from '@/components/skeleton'
import { ensureCovered } from '@/lib/ingest/on-demand'

export const metadata = {
  title: 'Compare companies | finlens',
}

/**
 * Rows are declared as data, not markup, so this table and the mobile client
 * render the same comparison in the same order.
 *
 * `better` is the stated rule for which value wins. Rows without one (price,
 * market cap, per-share fair value) are context, not a contest: a $500 share is
 * not "better" than a $170 share.
 */
const ROWS: Array<{
  group?: string
  label: string
  value: (s: StockSnapshot) => number | null
  format: (v: number | null, s: StockSnapshot) => string
  better?: Better
  rule?: string
}> = [
  { group: 'Market', label: 'Price', value: (s) => s.quote?.price ?? null, format: (v, s) => formatPrice(v, s.company.currency ?? 'USD') },
  { label: 'Market cap', value: (s) => s.quote?.marketCap ?? null, format: (v) => formatCurrencyCompact(v) },
  { label: 'P/E', value: (s) => s.quote?.peRatio ?? null, format: (v) => formatMultiple(v), better: 'lower', rule: 'Lower: less paid per dollar of earnings' },

  { group: 'Valuation', label: 'DCF fair value', value: (s) => s.valuation?.fairValuePerShare ?? null, format: (v, s) => formatPrice(v, s.company.currency ?? 'USD') },
  { label: 'Margin of safety', value: (s) => s.valuation?.marginOfSafetyPct ?? null, format: (v) => formatSignedPercent(v) },
  // No better/worse rule yet: it rests on the DCF's fixed default growth
  // (8%), which is wrong for fast growers. Scored again once the calculator
  // derives growth and discount rate per company.
  { label: 'Market-implied growth', value: (s) => s.valuation?.impliedGrowthRate ?? null, format: (v) => formatPercent(v), better: 'lower', rule: 'Lower: the price assumes less future growth' },

  { group: 'Profitability', label: 'Gross margin', value: (s) => s.metrics.grossMargin, format: (v) => formatPercent(v), better: 'higher' },
  { label: 'Operating margin', value: (s) => s.metrics.operatingMargin, format: (v) => formatPercent(v), better: 'higher' },
  { label: 'Net margin', value: (s) => s.metrics.netMargin, format: (v) => formatPercent(v), better: 'higher' },
  { label: 'FCF margin', value: (s) => s.metrics.fcfMargin, format: (v) => formatPercent(v), better: 'higher' },
  { label: 'Return on equity', value: (s) => s.metrics.returnOnEquity, format: (v) => formatPercent(v), better: 'higher' },
  { label: 'Return on invested capital', value: (s) => s.metrics.returnOnInvestedCapital, format: (v) => formatPercent(v), better: 'higher' },

  { group: 'Growth', label: 'Revenue CAGR', value: (s) => s.metrics.revenueCagr5y, format: (v, s) => withSpan(formatPercent(v), s), better: 'higher' },
  { label: 'Net income CAGR', value: (s) => s.metrics.netIncomeCagr5y, format: (v, s) => withSpan(formatPercent(v), s), better: 'higher' },
  { label: 'FCF CAGR', value: (s) => s.metrics.fcfCagr5y, format: (v, s) => withSpan(formatPercent(v), s), better: 'higher' },
  { label: 'Revenue YoY', value: (s) => s.metrics.revenueYoy, format: (v) => formatSignedPercent(v), better: 'higher' },

  { group: 'Balance sheet', label: 'Debt / equity', value: (s) => s.metrics.debtToEquity, format: (v) => formatMultiple(v), better: 'lower' },
  { label: 'Current ratio', value: (s) => s.metrics.currentRatio, format: (v) => formatMultiple(v), better: 'higher' },
  { label: 'Net debt', value: (s) => s.metrics.netDebt, format: (v) => formatCurrencyCompact(v), better: 'lower', rule: 'Lower: debt minus cash & short-term investments; negative = net cash' },

  { group: 'Share price return', label: '1 year', value: (s) => s.metrics.priceReturns.oneYear, format: (v) => formatSignedPercent(v) },
  { label: '5 years, annualised', value: (s) => s.metrics.priceReturns.fiveYearCagr, format: (v) => formatSignedPercent(v) },
]

/** Each company may have a different history depth, so the span rides with the value. */
function withSpan(value: string, s: StockSnapshot): string {
  return value === MISSING || s.metrics.growthYears === 0 ? value : `${value} (${s.metrics.growthYears}y)`
}

export default async function ComparePage(props: PageProps<'/compare'>) {
  const searchParams = await props.searchParams
  const raw = typeof searchParams.symbols === 'string' ? searchParams.symbols : ''

  const { limits } = await getCurrentEntitlement()

  const requested = [...new Set(raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))]

  // Trim to the plan before querying, so the extra companies are never fetched
  // and cannot be read out of the page payload.
  const allowed = requested.slice(0, limits.compareSymbols)
  const overflow = requested.slice(limits.compareSymbols)

  let snapshots = allowed.length >= 2 ? await getSnapshots(allowed) : []
  // Symbols picked from SEC's directory are not loaded yet: load them now
  // (same budget-capped path as the stock page), then read again.
  const unloaded = allowed.length >= 2 ? allowed.filter((s) => !snapshots.some((x) => x.company.symbol === s)) : []
  if (unloaded.length > 0) {
    const results = await Promise.all(unloaded.map((s) => ensureCovered(s)))
    if (results.some((r) => r.status === 'ready')) snapshots = await getSnapshots(allowed)
  }
  const found = new Set(snapshots.map((s) => s.company.symbol))
  // Only meaningful once a lookup ran — with one symbol nothing was fetched.
  const missing = allowed.length >= 2 ? allowed.filter((s) => !found.has(s)) : []

  // Same plan-depth rules as the stock page: applied to the query, not the view.
  const priceDays = Math.min(365 * 10, limits.priceHistoryDays)
  const companies: CompareCompany[] =
    snapshots.length >= 2
      ? await Promise.all(
          snapshots.map(async (s) => {
            const [annual, quarters, prices] = await Promise.all([
              getStatements(s.company.symbol, 'FY', limits.financialYears),
              getStatements(s.company.symbol, 'Q', Math.min(40, limits.financialYears * 4)),
              getPriceSeries(s.company.symbol, priceDays),
            ])
            return {
              symbol: s.company.symbol,
              series: buildFundamentalSeries(annual, quarters),
              prices: prices.map((p) => ({ tradeDate: p.tradeDate, close: p.close })),
            }
          }),
        )
      : []

  const winners = ROWS.map((row) =>
    row.better ? pickWinner(snapshots.map((s) => row.value(s)), row.better) : null,
  )
  const contested = winners.filter((w) => w != null).length
  const wins = snapshots.map((_, i) => winners.filter((w) => w === i).length)

  return (
    <Reveal>
    <div className="space-y-8">
      <SectionHeading
        title="Compare companies"
        subtitle={`Valuation, margins and growth side by side. Your plan compares up to ${limits.compareSymbols} at once.`}
      />

      <ComparePicker symbols={allowed} limit={limits.compareSymbols} />

      {overflow.length > 0 && (
        <UpgradePrompt
          feature={`Compare up to ${PRO_LIMITS.compareSymbols} companies at once — ${overflow.join(', ')} ${overflow.length === 1 ? 'was' : 'were'} left out`}
        />
      )}

      {missing.length > 0 && (
        // Partial results beat an error page — the user still gets the
        // comparison they can have, and knows exactly what is absent.
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Could not load: <span className="font-mono">{missing.join(', ')}</span>
        </div>
      )}

      {snapshots.length < 2 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
          Add at least two companies to compare, e.g.{' '}
          <Link href="/compare?symbols=AAPL,MSFT" className="font-mono underline underline-offset-4">
            AAPL vs MSFT
          </Link>
          .
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Metric</th>
                    {snapshots.map((s, i) => (
                      <th key={s.company.symbol} className="px-4 py-3 text-right align-top">
                        <Link
                          href={`/stocks/${s.company.symbol}`}
                          className="inline-flex items-center gap-2 font-mono font-semibold underline-offset-4 hover:underline"
                        >
                          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--series-${(i % 4) + 1})` }} />
                          {s.company.symbol}
                        </Link>
                        <span className="block max-w-[12rem] truncate text-xs font-normal text-zinc-500 sm:ml-auto">
                          {s.company.name}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-zinc-500">
                          Better on {wins[i]} of {contested}
                        </span>
                        <span className="block text-[11px] font-normal text-zinc-400">
                          {s.basis.kind === 'TTM' ? `TTM to ${s.basis.periodEnd}` : `FY ${s.basis.fiscalYear ?? '—'}`}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, r) => (
                    // Fragment carries the key — the returned element of a map is
                    // what React reconciles, not the rows nested inside it.
                    <Fragment key={row.label}>
                      {row.group && (
                        <tr className="bg-zinc-50 dark:bg-zinc-900/60">
                          <td colSpan={snapshots.length + 1} className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                            {row.group}
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                        <td className="px-4 py-2.5 text-zinc-500">
                          {row.label}
                          {row.better && (
                            <span className="ml-1.5 text-[11px] text-zinc-400" title={row.rule}>
                              {row.better === 'higher' ? '↑ better' : '↓ better'}
                            </span>
                          )}
                        </td>
                        {snapshots.map((s, i) => {
                          const v = row.value(s)
                          const text = row.format(v, s)
                          const win = winners[r] === i
                          return (
                            <td
                              key={s.company.symbol}
                              className={`px-4 py-2.5 text-right font-mono ${
                                text === MISSING ? 'text-zinc-400' : ''
                              } ${win ? 'bg-emerald-50 font-semibold dark:bg-emerald-950/40' : ''}`}
                            >
                              {win && (
                                <span className="mr-1.5 text-emerald-600 dark:text-emerald-400" aria-label="better">
                                  ✓
                                </span>
                              )}
                              {text}
                            </td>
                          )
                        })}
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500">
              ✓ marks the better value where the row has a rule (↑ higher is better, ↓ lower is better; hover a rule for
              why). Ties and missing values get no mark. Ratios use each company&apos;s latest TTM where four consecutive
              quarters exist, otherwise its latest fiscal year. A count of better metrics is a summary, not a
              recommendation.
            </p>
          </section>

          <section>
            <SectionHeading
              title="Over time"
              subtitle="Pick metrics to chart. Different fiscal calendars are lined up by calendar period."
            />
            <CompareCharts companies={companies} currency={snapshots[0].company.currency ?? 'USD'} />
          </section>
        </>
      )}
    </div>
    </Reveal>
  )
}
