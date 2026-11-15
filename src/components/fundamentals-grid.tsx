'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  downsample,
  withinYears,
  type FundamentalPoint,
  type PeriodMode,
} from '@/lib/fundamentals'
import {
  formatCurrencyCompact,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  MISSING,
} from '@/lib/format'
import { toNumber } from '@/components/financials-chart'

export interface PricePoint {
  tradeDate: string
  close: number
}

type MetricKey = Exclude<keyof FundamentalPoint, 'label' | 'periodEnd'>
type Kind = 'currency' | 'perShare' | 'percent'

/** One measure per tile, one hue per tile: small multiples, never a dual axis. */
const TILES: Array<{ key: MetricKey; title: string; kind: Kind }> = [
  { key: 'revenue', title: 'Revenue', kind: 'currency' },
  { key: 'ebitda', title: 'EBITDA', kind: 'currency' },
  { key: 'netIncome', title: 'Net income', kind: 'currency' },
  { key: 'epsDiluted', title: 'EPS (diluted)', kind: 'perShare' },
  { key: 'operatingCashFlow', title: 'Operating cash flow', kind: 'currency' },
  { key: 'freeCashFlow', title: 'Free cash flow', kind: 'currency' },
  { key: 'netMargin', title: 'Net margin', kind: 'percent' },
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

/** Tooltip in theme colours: text stays in text ink, never the series colour. */
export const TOOLTIP_PROPS = {
  contentStyle: {
    fontSize: 12,
    borderRadius: 8,
    background: 'var(--background)',
    border: '1px solid rgb(113 113 122 / 0.35)',
    color: 'var(--foreground)',
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 600 },
  itemStyle: { color: 'var(--foreground)' },
} as const

const BAR = '#0ea5e9' // sky-500: readable on both the light and dark surface
const LOSS = '#f43f5e' // rose-500: a loss is not a small profit
const UP = '#10b981'

/** "6M", "1Y", "5Y" — rounded span between two ISO dates. */
export function spanLabel(fromIso: string, toIso: string): string {
  const months = Math.round((Date.parse(toIso) - Date.parse(fromIso)) / (30.44 * 86_400_000))
  return months < 12 ? `${Math.max(months, 1)}M` : `${Math.round(months / 12)}Y`
}

function format(kind: Kind, v: number | null, currency: string): string {
  if (kind === 'percent') return formatPercent(v)
  if (kind === 'perShare') return formatPrice(v, currency)
  return formatCurrencyCompact(v, currency)
}

export function FundamentalsGrid({
  series,
  prices,
  currency,
  priceNote,
}: {
  series: Record<PeriodMode, FundamentalPoint[]>
  /** Ascending daily closes. */
  prices: PricePoint[]
  currency: string
  /** Shown under the price tile, e.g. a plan limit on history depth. */
  priceNote?: string
}) {
  const [mode, setMode] = useState<PeriodMode>(
    series.ttm.length >= 2 ? 'ttm' : series.annual.length > 0 ? 'annual' : 'quarterly',
  )
  const [years, setYears] = useState<number | null>(5)
  const [expanded, setExpanded] = useState<string | null>(null)

  const points = useMemo(() => withinYears(series[mode], years), [series, mode, years])
  const pricePoints = useMemo(() => downsample(withinYears(prices, years), 600), [prices, years])

  const priceChange =
    pricePoints.length >= 2 ? pricePoints[pricePoints.length - 1].close / pricePoints[0].close - 1 : null
  // Name the span the data actually covers, not the button pressed: on a plan
  // with one year of prices, "5Y" selected still only measures one year.
  const priceSpan =
    pricePoints.length >= 2 ? spanLabel(pricePoints[0].tradeDate, pricePoints[pricePoints.length - 1].tradeDate) : ''

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Period"
          options={MODES.map((m) => ({
            key: m.id,
            label: m.label,
            disabled: series[m.id].length === 0,
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

      <div className="grid grid-flow-row-dense gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          id="price"
          title="Share price"
          headline={pricePoints.length ? formatPrice(pricePoints[pricePoints.length - 1].close, currency) : MISSING}
          badge={priceChange == null ? undefined : `${priceSpan} ${formatSignedPercent(priceChange)}`}
          badgeUp={priceChange != null && priceChange >= 0}
          expanded={expanded === 'price'}
          onToggle={() => setExpanded(expanded === 'price' ? null : 'price')}
          note={priceNote}
        >
          {pricePoints.length < 2 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pricePoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tilePriceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={priceChange != null && priceChange < 0 ? LOSS : UP} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={priceChange != null && priceChange < 0 ? LOSS : UP} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <XAxis dataKey="tradeDate" tick={{ fontSize: 10 }} minTickGap={40} tickFormatter={(v: string) => v.slice(0, 7)} />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10 }}
                  width={56}
                  tickFormatter={(v: number) => formatCurrencyCompact(v, currency)}
                />
                <Tooltip
                  formatter={(v: unknown) => [formatPrice(toNumber(v), currency), 'Close']}
                  {...TOOLTIP_PROPS}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={priceChange != null && priceChange < 0 ? LOSS : UP}
                  strokeWidth={2}
                  fill="url(#tilePriceFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Tile>

        {TILES.map((t) => {
          const latest = points.length ? points[points.length - 1][t.key] : null
          return (
            <Tile
              key={t.key}
              id={t.key}
              title={t.title}
              headline={format(t.kind, latest, currency)}
              sub={points.length ? points[points.length - 1].label : undefined}
              expanded={expanded === t.key}
              onToggle={() => setExpanded(expanded === t.key ? null : t.key)}
            >
              {points.every((p) => p[t.key] == null) ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={16} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={56}
                      tickFormatter={(v: number) =>
                        t.kind === 'percent' ? formatPercent(v, 0) : t.kind === 'perShare' ? v.toFixed(2) : formatCurrencyCompact(v, currency)
                      }
                    />
                    <Tooltip
                      cursor={{ fillOpacity: 0.08 }}
                      formatter={(v: unknown) => [format(t.kind, toNumber(v), currency), t.title]}
                      {...TOOLTIP_PROPS}
                    />
                    <Bar dataKey={t.key} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {points.map((p) => (
                        <Cell key={p.label} fill={(p[t.key] ?? 0) < 0 ? LOSS : BAR} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Tile>
          )
        })}
      </div>
    </div>
  )
}

function Tile({
  title,
  headline,
  sub,
  badge,
  badgeUp,
  expanded,
  onToggle,
  note,
  children,
}: {
  id: string
  title: string
  headline: string
  sub?: string
  badge?: string
  badgeUp?: boolean
  expanded: boolean
  onToggle: () => void
  note?: string
  children: ReactNode
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 ${
        expanded ? 'sm:col-span-2 lg:col-span-4' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</h3>
            {badge && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  badgeUp
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold">
            {headline}
            {sub && <span className="ml-2 text-xs font-normal text-zinc-400">{sub}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          className="rounded-md px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          {expanded ? '↙' : '↗'}
        </button>
      </div>
      <div className={`mt-2 w-full ${expanded ? 'h-80' : 'h-40'}`}>{children}</div>
      {note && <p className="mt-1 text-[11px] text-zinc-400">{note}</p>}
    </div>
  )
}

export function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ key: string; label: string; disabled?: boolean }>
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          disabled={o.disabled}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            value === o.key
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
      No data for this range
    </div>
  )
}
