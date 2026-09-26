'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrencyCompact, formatPercent } from '@/lib/format'

export interface FinancialsPoint {
  fiscalYear: number
  revenue: number | null
  netIncome: number | null
  ebitda: number | null
  freeCashFlow: number | null
  netMargin: number | null
}

/**
 * Revenue / EBITDA / net income / FCF over time, with net margin on a second
 * axis.
 *
 * Bars are absolute currency and share one axis; margin is a percentage and
 * gets its own — plotting a 0.25 margin against a 4e11 revenue on one scale
 * renders the margin as a flat line on the floor.
 */
export function FinancialsChart({ data }: { data: FinancialsPoint[] }) {
  // Charts read left-to-right in time; the query returns newest first.
  const series = [...data].reverse()

  if (series.length === 0) {
    return (
      <EmptyChart message="No annual statements ingested for this company yet." />
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="fiscalYear" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="abs"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            width={64}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatPercent(v, 0)}
            width={52}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) =>
              name === 'Net margin' ? formatPercent(toNumber(value)) : formatCurrencyCompact(toNumber(value))
            }
            labelFormatter={(label) => `FY ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="abs" dataKey="revenue" name="Revenue" fill="#71717a" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="abs" dataKey="ebitda" name="EBITDA" fill="#a1a1aa" radius={[3, 3, 0, 0]} />
          <Bar yAxisId="abs" dataKey="netIncome" name="Net income" radius={[3, 3, 0, 0]}>
            {series.map((p) => (
              // A loss is not a small profit — colour it so the eye catches it
              // before the axis label does.
              <Cell
                key={p.fiscalYear}
                fill={(p.netIncome ?? 0) < 0 ? '#f43f5e' : '#18181b'}
              />
            ))}
          </Bar>
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="netMargin"
            name="Net margin"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface CashFlowPoint {
  fiscalYear: number
  operatingCashFlow: number | null
  capitalExpenditure: number | null
  freeCashFlow: number | null
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  const series = [...data].reverse()

  if (series.length === 0) {
    return <EmptyChart message="No cash flow data ingested yet." />
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="fiscalYear" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            width={64}
          />
          <Tooltip
            formatter={(value: unknown) => formatCurrencyCompact(toNumber(value))}
            labelFormatter={(label) => `FY ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="operatingCashFlow" name="Operating CF" fill="#71717a" radius={[3, 3, 0, 0]} />
          <Bar dataKey="capitalExpenditure" name="Capex" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="freeCashFlow" name="Free cash flow" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Recharts v3 hands tooltip formatters a loose `ValueType | undefined`.
 *  Narrow once here rather than casting at every call site. */
export function toNumber(value: unknown): number | null {
  return typeof value === 'number' && isFinite(value) ? value : null
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
      {message}
    </div>
  )
}
