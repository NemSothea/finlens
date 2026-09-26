import { Fragment } from 'react'
import Link from 'next/link'
import { SectionHeading } from '@/components/metric-card'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { getCurrentEntitlement } from '@/lib/queries/billing'
import { PRO_LIMITS } from '@/lib/billing/entitlements'
import { getSnapshots, type StockSnapshot } from '@/lib/queries/stocks'
import {
  formatCurrencyCompact,
  formatMultiple,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'

export const metadata = {
  title: 'Compare companies | finlens',
}

/** Rows are declared as data, not markup, so both this table and the mobile
 *  client render the same comparison in the same order. */
const ROWS: Array<{
  label: string
  get: (s: StockSnapshot) => string
  tone?: (s: StockSnapshot) => string | undefined
  group?: string
}> = [
  { group: 'Market', label: 'Price', get: (s) => formatPrice(s.quote?.price, s.company.currency ?? 'USD') },
  { label: 'Market cap', get: (s) => formatCurrencyCompact(s.quote?.marketCap) },
  { label: 'P/E', get: (s) => formatMultiple(s.quote?.peRatio) },

  {
    group: 'Valuation',
    label: 'DCF fair value',
    get: (s) => formatPrice(s.valuation?.fairValuePerShare, s.company.currency ?? 'USD'),
  },
  {
    label: 'Margin of safety',
    get: (s) => formatSignedPercent(s.valuation?.marginOfSafetyPct),
    tone: (s) => toneForSigned(s.valuation?.marginOfSafetyPct),
  },
  {
    label: 'Implied growth',
    get: (s) => formatPercent(s.valuation?.impliedGrowthRate),
  },

  { group: 'Profitability', label: 'Gross margin', get: (s) => formatPercent(s.metrics.grossMargin) },
  { label: 'Operating margin', get: (s) => formatPercent(s.metrics.operatingMargin) },
  { label: 'Net margin', get: (s) => formatPercent(s.metrics.netMargin) },
  { label: 'FCF margin', get: (s) => formatPercent(s.metrics.fcfMargin) },
  { label: 'Return on equity', get: (s) => formatPercent(s.metrics.returnOnEquity) },

  {
    group: 'Growth',
    label: 'Revenue CAGR 5y',
    get: (s) => formatPercent(s.metrics.revenueCagr5y),
    tone: (s) => toneForSigned(s.metrics.revenueCagr5y),
  },
  {
    label: 'Net income CAGR 5y',
    get: (s) => formatPercent(s.metrics.netIncomeCagr5y),
    tone: (s) => toneForSigned(s.metrics.netIncomeCagr5y),
  },
  {
    label: 'FCF CAGR 5y',
    get: (s) => formatPercent(s.metrics.fcfCagr5y),
    tone: (s) => toneForSigned(s.metrics.fcfCagr5y),
  },

  { group: 'Balance sheet', label: 'Debt / equity', get: (s) => formatMultiple(s.metrics.debtToEquity) },
  { label: 'Current ratio', get: (s) => formatMultiple(s.metrics.currentRatio) },
  { label: 'Net debt', get: (s) => formatCurrencyCompact(s.metrics.netDebt) },
]

export default async function ComparePage(props: PageProps<'/compare'>) {
  const searchParams = await props.searchParams
  const raw = typeof searchParams.symbols === 'string' ? searchParams.symbols : ''

  const { limits } = await getCurrentEntitlement()

  const requested = raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)

  // Trim to the plan before querying, so the extra companies are never fetched
  // and cannot be read out of the page payload.
  const allowed = requested.slice(0, limits.compareSymbols)
  const overflow = requested.slice(limits.compareSymbols)

  const snapshots = allowed.length >= 2 ? await getSnapshots(allowed) : []

  const found = new Set(snapshots.map((s) => s.company.symbol))
  const missing = allowed.filter((s) => !found.has(s))

  if (requested.length < 2) {
    return (
      <div className="space-y-4">
        <SectionHeading
          title="Compare companies"
          subtitle="Put two businesses side by side before committing a dollar."
        />
        <p className="text-sm text-zinc-500">
          Pass at least two symbols, e.g.{' '}
          <Link href="/compare?symbols=AAPL,MSFT" className="font-mono underline underline-offset-4">
            /compare?symbols=AAPL,MSFT
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Compare"
        subtitle={`${snapshots.length} of ${requested.length} requested companies. Up to four at a time.`}
      />

      {overflow.length > 0 && (
        <UpgradePrompt
          feature={`Compare up to ${PRO_LIMITS.compareSymbols} companies at once — ${overflow.join(', ')} ${overflow.length === 1 ? 'was' : 'were'} left out`}
        />
      )}

      {missing.length > 0 && (
        // Partial results beat an error page — the user still gets the
        // comparison they can have, and knows exactly what is absent.
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Not in our universe: <span className="font-mono">{missing.join(', ')}</span>
        </div>
      )}

      {snapshots.length < 2 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
          Need at least two covered companies to compare.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Metric
                </th>
                {snapshots.map((s) => (
                  <th key={s.company.symbol} className="px-4 py-3 text-right">
                    <Link
                      href={`/stocks/${s.company.symbol}`}
                      className="font-mono font-semibold underline-offset-4 hover:underline"
                    >
                      {s.company.symbol}
                    </Link>
                    <span className="block max-w-[12rem] truncate text-xs font-normal text-zinc-500">
                      {s.company.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                // Fragment carries the key — the returned element of a map is
                // what React reconciles, not the rows nested inside it.
                <Fragment key={row.label}>
                  {row.group && (
                    <tr className="bg-zinc-50 dark:bg-zinc-900/60">
                      <td
                        colSpan={snapshots.length + 1}
                        className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500"
                      >
                        {row.group}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <td className="px-4 py-2.5 text-zinc-500">{row.label}</td>
                    {snapshots.map((s) => {
                      const value = row.get(s)
                      return (
                        <td
                          key={s.company.symbol}
                          className={`px-4 py-2.5 text-right font-mono ${
                            value === MISSING ? 'text-zinc-400' : (row.tone?.(s) ?? '')
                          }`}
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
