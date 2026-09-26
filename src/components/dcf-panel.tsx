'use client'

import { useMemo, useState } from 'react'
import {
  calculateDcf,
  marginOfSafety,
  reverseDcf,
  type DcfAssumptions,
  type DcfResult,
} from '@/lib/valuation/dcf'
import { buildSensitivityGrid, gridSupportRatio } from '@/lib/valuation/sensitivity'
import {
  formatCurrencyCompact,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'

/**
 * Interactive DCF.
 *
 * Recomputation runs in the browser against the SAME pure module the ingest
 * pipeline and the valuation endpoint use — imported, not reimplemented. That
 * is what makes live editing safe: there is one formula, so a slider can never
 * disagree with the cached number on the home page.
 */

export interface DcfPanelProps {
  symbol: string
  currency: string
  price: number | null
  initialAssumptions: DcfAssumptions
  warnings: string[]
  fcfYearsUsed: number
}

export function DcfPanel({
  symbol,
  currency,
  price,
  initialAssumptions,
  warnings,
  fcfYearsUsed,
}: DcfPanelProps) {
  const [assumptions, setAssumptions] = useState<DcfAssumptions>(initialAssumptions)

  function update<K extends keyof DcfAssumptions>(key: K, value: DcfAssumptions[K]) {
    setAssumptions((a) => ({ ...a, [key]: value }))
  }

  const dirty =
    assumptions.growthRate !== initialAssumptions.growthRate ||
    assumptions.growthYears !== initialAssumptions.growthYears ||
    assumptions.terminalGrowthRate !== initialAssumptions.terminalGrowthRate ||
    assumptions.discountRate !== initialAssumptions.discountRate ||
    assumptions.fade !== initialAssumptions.fade ||
    assumptions.baseFreeCashFlow !== initialAssumptions.baseFreeCashFlow

  const computed = useMemo(() => {
    // calculateDcf throws on r <= g by design rather than returning a garbage
    // number. The panel catches it and renders the reason — sliders can reach
    // that combination, and a thrown error must not blank the page.
    try {
      const result: DcfResult = calculateDcf(assumptions)
      const grid = buildSensitivityGrid(assumptions, price)

      return {
        ok: true as const,
        result,
        mos: price ? marginOfSafety(result.fairValuePerShare, price) : null,
        implied: price ? reverseDcf({ ...assumptions, currentPrice: price }) : null,
        grid,
        support: gridSupportRatio(grid, price),
      }
    } catch (error) {
      return { ok: false as const, message: (error as Error).message }
    }
  }, [assumptions, price])

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {!computed.ok ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {computed.message}. The discount rate must stay above terminal growth — otherwise the
          terminal value is infinite.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Readout
            label="Fair value"
            value={formatPrice(computed.result.fairValuePerShare, currency)}
            hint={dirty ? 'your assumptions' : 'default assumptions'}
          />
          <Readout
            label="Margin of safety"
            value={formatSignedPercent(computed.mos)}
            hint={price ? `vs ${formatPrice(price, currency)}` : 'no price available'}
            tone={toneForSigned(computed.mos)}
          />
          <Readout
            label="Price implies growth of"
            value={
              computed.implied?.converged
                ? formatPercent(computed.implied.impliedGrowthRate)
                : MISSING
            }
            hint="reverse DCF — believable?"
          />
          <Readout
            label="From terminal value"
            value={formatPercent(computed.result.terminalValueShare)}
            hint="above ~75% you are betting on the perpetuity"
            tone={computed.result.terminalValueShare > 0.75 ? 'text-amber-500' : undefined}
          />
        </div>
      )}

      {/* ── Assumptions ──────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Assumptions</h3>
          <button
            type="button"
            onClick={() => setAssumptions(initialAssumptions)}
            disabled={!dirty}
            className="text-xs text-zinc-500 underline underline-offset-4 transition enabled:hover:text-zinc-900 disabled:opacity-40 dark:enabled:hover:text-zinc-100"
          >
            Reset to defaults
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Slider
            label="Stage-1 growth"
            value={assumptions.growthRate}
            min={-0.2}
            max={0.4}
            step={0.005}
            format={(v) => formatPercent(v)}
            onChange={(v) => update('growthRate', v)}
            hint="Annual free cash flow growth over the forecast horizon."
          />
          <Slider
            label="Forecast horizon"
            value={assumptions.growthYears}
            min={3}
            max={20}
            step={1}
            format={(v) => `${v} years`}
            onChange={(v) => update('growthYears', Math.round(v))}
            hint="How long you can credibly forecast this business."
          />
          <Slider
            label="Terminal growth"
            value={assumptions.terminalGrowthRate}
            min={0}
            max={0.05}
            step={0.0025}
            format={(v) => formatPercent(v)}
            onChange={(v) => update('terminalGrowthRate', v)}
            hint="Perpetual rate after the horizon. Above long-run GDP is a claim the company outgrows the economy forever."
          />
          <Slider
            label="Discount rate"
            value={assumptions.discountRate}
            min={0.03}
            max={0.25}
            step={0.005}
            format={(v) => formatPercent(v)}
            onChange={(v) => update('discountRate', v)}
            hint="Your required return. Must exceed terminal growth."
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assumptions.fade ?? true}
              onChange={(e) => update('fade', e.target.checked)}
              className="h-4 w-4"
            />
            <span>
              Fade growth toward terminal
              <span className="ml-2 text-xs text-zinc-500">
                no business steps from {formatPercent(assumptions.growthRate)} to{' '}
                {formatPercent(assumptions.terminalGrowthRate)} overnight
              </span>
            </span>
          </label>

          <div className="text-xs text-zinc-500">
            Base free cash flow{' '}
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {formatCurrencyCompact(assumptions.baseFreeCashFlow, currency)}
            </span>{' '}
            · {fcfYearsUsed}-year average
          </div>
        </div>
      </div>

      {computed.ok && (
        <>
          {/* ── Value bridge ───────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Readout
              label="PV of forecast"
              value={formatCurrencyCompact(computed.result.pvOfForecast, currency)}
              hint={`${assumptions.growthYears} explicit years`}
            />
            <Readout
              label="PV of terminal value"
              value={formatCurrencyCompact(computed.result.pvOfTerminalValue, currency)}
              hint="everything after the horizon"
            />
            <Readout
              label="Equity value"
              value={formatCurrencyCompact(computed.result.equityValue, currency)}
              hint={`enterprise value less net debt of ${formatCurrencyCompact(assumptions.netDebt, currency)}`}
            />
          </div>

          {/* ── Sensitivity ────────────────────────────────────── */}
          <div>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">Sensitivity</h3>
              <p className="text-xs text-zinc-500">
                {computed.support == null
                  ? 'No price to compare against.'
                  : `${formatPercent(computed.support, 0)} of these assumption pairs put ${symbol} below fair value.`}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">
                      Discount ↓ / Growth →
                    </th>
                    {computed.grid.growthRates.map((g) => (
                      <th key={g} className="px-3 py-2 text-right font-mono font-medium">
                        {formatPercent(g, 1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {computed.grid.cells.map((row, r) => (
                    <tr key={computed.grid.discountRates[r]} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                      <td className="px-3 py-2 font-mono text-zinc-500">
                        {formatPercent(computed.grid.discountRates[r], 1)}
                      </td>
                      {row.map((cell, c) => (
                        <td
                          key={`${r}-${c}`}
                          className="px-3 py-2 text-right font-mono"
                          style={cellStyle(cell.marginOfSafety, cell.invalid)}
                          title={
                            cell.invalid
                              ? 'Discount rate is at or below terminal growth — no valid value'
                              : `Margin of safety ${formatSignedPercent(cell.marginOfSafety)}`
                          }
                        >
                          {cell.invalid ? MISSING : formatPrice(cell.fairValuePerShare, currency)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Green = fair value above the current price at that pair of assumptions. A single
              number invites false precision; the spread is the honest answer.
            </p>
          </div>

          {/* ── Projection ─────────────────────────────────────── */}
          <details className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            <summary className="cursor-pointer px-5 py-3 text-sm font-semibold">
              Year-by-year projection
            </summary>
            <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Year</th>
                    <th className="px-4 py-2 text-right font-medium">Growth</th>
                    <th className="px-4 py-2 text-right font-medium">Free cash flow</th>
                    <th className="px-4 py-2 text-right font-medium">Discount factor</th>
                    <th className="px-4 py-2 text-right font-medium">Present value</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {computed.result.years.map((y) => (
                    <tr key={y.year} className="border-t border-zinc-100 dark:border-zinc-900">
                      <td className="px-4 py-2">{y.year}</td>
                      <td className="px-4 py-2 text-right">{formatPercent(y.growthRate)}</td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrencyCompact(y.freeCashFlow, currency)}
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-500">
                        {y.discountFactor.toFixed(3)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrencyCompact(y.presentValue, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  )
}

/** Tint by margin of safety. Inline style, not a Tailwind class — the opacity
 *  is continuous, and Tailwind cannot generate arbitrary runtime values. */
function cellStyle(mos: number | null, invalid: boolean): React.CSSProperties {
  if (invalid || mos == null || !isFinite(mos)) return { color: 'rgb(161 161 170)' }

  const strength = Math.min(Math.abs(mos), 0.6) / 0.6
  const alpha = 0.08 + strength * 0.22

  return mos > 0
    ? { backgroundColor: `rgba(16, 185, 129, ${alpha})` }
    : { backgroundColor: `rgba(244, 63, 94, ${alpha})` }
}

function Readout({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${tone ?? ''}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-mono text-sm">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-zinc-900 dark:accent-zinc-100"
      />
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}
