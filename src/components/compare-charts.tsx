'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { downsample, withinYears, type FundamentalPoint, type PeriodMode } from '@/lib/fundamentals'
import { alignByCalendar, indexPrices } from '@/lib/compare'
import { formatCurrencyCompact, formatPercent, formatPrice } from '@/lib/format'
import { toNumber } from '@/components/financials-chart'
import { Segmented, TOOLTIP_PROPS } from '@/components/fundamentals-grid'

export interface CompareCompany {
  symbol: string
  series: Record<PeriodMode, FundamentalPoint[]>
  /** Ascending daily closes. */
  prices: Array<{ tradeDate: string; close: number }>
}

type MetricKey = Exclude<keyof FundamentalPoint, 'label' | 'periodEnd'>
type ChartId = 'price' | MetricKey

const CHARTS: Array<{ id: ChartId; label: string; kind: 'index' | 'currency' | 'perShare' | 'percent' }> = [
  { id: 'price', label: 'Share price', kind: 'index' },
  { id: 'revenue', label: 'Revenue', kind: 'currency' },
  { id: 'ebitda', label: 'EBITDA', kind: 'currency' },
  { id: 'netIncome', label: 'Net income', kind: 'currency' },
  { id: 'epsDiluted', label: 'EPS (diluted)', kind: 'perShare' },
  { id: 'operatingCashFlow', label: 'Operating cash flow', kind: 'currency' },
  { id: 'freeCashFlow', label: 'Free cash flow', kind: 'currency' },
  { id: 'netMargin', label: 'Net margin', kind: 'percent' },
]

const MODES: Array<{ id: PeriodMode; label: string }> = [
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'ttm', label: 'Quarterly (TTM)' },
  { id: 'annual', label: 'Annually' },
]

const RANGES: Array<{ label: string; years: number | null }> = [
  { label: '1Y', years: 1 },
  { label: '2Y', years: 2 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: 'MAX', years: null },
]

/** Colour follows the company's slot in the URL — the same dot as its chip. */
const color = (i: number) => `var(--series-${(i % 4) + 1})`

export function CompareCharts({ companies, currency }: { companies: CompareCompany[]; currency: string }) {
  const hasTtm = companies.every((c) => c.series.ttm.length >= 2)
  const [mode, setMode] = useState<PeriodMode>(hasTtm ? 'ttm' : 'annual')
  const [years, setYears] = useState<number | null>(5)
  const [selected, setSelected] = useState<ChartId[]>(['price', 'revenue'])

  const toggle = (id: ChartId) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const indexed = useMemo(
    () =>
      downsample(
        indexPrices(companies.map((c) => ({ symbol: c.symbol, bars: withinYears(c.prices, years) }))),
        500,
      ),
    [companies, years],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Metrics to chart">
        {CHARTS.map((c) => {
          const on = selected.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c.id)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                on
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400'
              }`}
            >
              {on ? '✓ ' : '+ '}
              {c.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Period"
          options={MODES.map((m) => ({
            key: m.id,
            label: m.label,
            disabled: companies.every((c) => c.series[m.id].length === 0),
          }))}
          value={mode}
          onChange={(k) => setMode(k as PeriodMode)}
        />
        <Segmented
          label="Range"
          options={RANGES.map((r) => ({ key: r.label, label: r.label }))}
          value={RANGES.find((r) => r.years === years)?.label ?? 'MAX'}
          onChange={(k) => setYears(RANGES.find((r) => r.label === k)?.years ?? null)}
        />
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-zinc-500">Pick a metric above to chart it.</p>
      )}

      {CHARTS.filter((c) => selected.includes(c.id)).map((c) => (
        <figure key={c.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{c.label}</span>
            <span className="text-xs text-zinc-500">
              {c.kind === 'index'
                ? indexed.length >= 2
                  ? `Growth of 100 · ${indexed[0].tradeDate} to ${indexed[indexed.length - 1].tradeDate}`
                  : 'Growth of 100 from the first shared trading day'
                : `Aligned by calendar ${mode === 'annual' ? 'year' : 'quarter'} of each period's midpoint`}
            </span>
          </figcaption>
          <div className="h-72 w-full">
            {c.id === 'price' ? (
              indexed.length < 2 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={indexed} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                    <XAxis dataKey="tradeDate" tick={{ fontSize: 11 }} minTickGap={48} tickFormatter={(v: string) => v.slice(0, 7)} />
                    <YAxis tick={{ fontSize: 11 }} width={44} domain={['auto', 'auto']} />
                    <ReferenceLine y={100} stroke="#a1a1aa" strokeDasharray="4 4" />
                    <Tooltip
                      formatter={(v: unknown, name: unknown) => [
                        `${(toNumber(v) ?? 0).toFixed(1)} (${formatPercent((toNumber(v) ?? 100) / 100 - 1)})`,
                        String(name),
                      ]}
                      {...TOOLTIP_PROPS}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {companies.map((co, i) => (
                      <Line
                        key={co.symbol}
                        dataKey={co.symbol}
                        stroke={color(i)}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )
            ) : (
              <MetricBars companies={companies} metric={c.id} mode={mode} years={years} kind={c.kind} currency={currency} />
            )}
          </div>
        </figure>
      ))}
    </div>
  )
}

function MetricBars({
  companies,
  metric,
  mode,
  years,
  kind,
  currency,
}: {
  companies: CompareCompany[]
  metric: MetricKey
  mode: PeriodMode
  years: number | null
  kind: 'index' | 'currency' | 'perShare' | 'percent'
  currency: string
}) {
  const rows = useMemo(
    () =>
      alignByCalendar(
        companies.map((c) => ({ symbol: c.symbol, points: withinYears(c.series[mode], years) })),
        metric,
        mode === 'annual' ? 'year' : 'quarter',
      ),
    [companies, metric, mode, years],
  )

  const fmt = (v: number | null) =>
    kind === 'percent' ? formatPercent(v) : kind === 'perShare' ? formatPrice(v, currency) : formatCurrencyCompact(v, currency)

  if (rows.length === 0) return <Empty />

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} barGap={2} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis dataKey="x" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={60}
          tickFormatter={(v: number) =>
            kind === 'percent' ? formatPercent(v, 0) : kind === 'perShare' ? v.toFixed(2) : formatCurrencyCompact(v, currency)
          }
        />
        <Tooltip
          cursor={{ fillOpacity: 0.08 }}
          formatter={(v: unknown, name: unknown) => [fmt(toNumber(v)), String(name)]}
          {...TOOLTIP_PROPS}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {companies.map((co, i) => (
          <Bar key={co.symbol} dataKey={co.symbol} fill={color(i)} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function Empty() {
  return <div className="flex h-full items-center justify-center text-xs text-zinc-400">No data for this range</div>
}
