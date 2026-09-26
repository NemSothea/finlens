'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatPrice } from '@/lib/format'
import { toNumber } from '@/components/financials-chart'

export interface PricePoint {
  tradeDate: string
  close: number
}

/**
 * Daily closes with an optional fair-value reference line.
 *
 * The Y axis is NOT zero-based. For a price series, anchoring at zero
 * compresses a year of movement into a flat band at the top of the chart —
 * the opposite of what a reader is here to see. (Bar charts of absolute
 * quantities are the case where a zero baseline is mandatory; this is not that.)
 */
export function PriceChart({
  data,
  fairValue,
}: {
  data: PricePoint[]
  fairValue?: number | null
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
        No price history ingested for this window.
      </div>
    )
  }

  const closes = data.map((d) => d.close)
  const min = Math.min(...closes, fairValue && fairValue > 0 ? fairValue : Infinity)
  const max = Math.max(...closes, fairValue && fairValue > 0 ? fairValue : -Infinity)
  const pad = (max - min) * 0.08 || max * 0.08

  const first = closes[0]
  const last = closes[closes.length - 1]
  const up = last >= first
  const stroke = up ? '#10b981' : '#f43f5e'

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis
            dataKey="tradeDate"
            tick={{ fontSize: 11 }}
            minTickGap={48}
            tickFormatter={(v: string) => v.slice(0, 7)}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => formatPrice(v)}
            width={72}
          />
          <Tooltip
            formatter={(value: unknown) => formatPrice(toNumber(value))}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          {fairValue != null && fairValue > 0 && (
            <ReferenceLine
              y={fairValue}
              stroke="#0ea5e9"
              strokeDasharray="4 4"
              label={{
                value: `DCF fair value ${formatPrice(fairValue)}`,
                position: 'insideTopLeft',
                fontSize: 11,
                fill: '#0ea5e9',
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="close"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#priceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
