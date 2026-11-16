'use client'

import { useMemo, useState } from 'react'
import {
  calculateDcf,
  marginOfSafety,
  reverseDcf,
  DEFAULT_ASSUMPTIONS,
  THREE_STAGE_DEFAULTS,
  type DcfAssumptions,
  type DcfResult,
} from '@/lib/valuation/dcf'
import { buildSensitivityGrid, gridSupportRatio } from '@/lib/valuation/sensitivity'
import {
  assumptionsFor,
  type CashFlowBasis,
  type CashFlowFlavour,
  type DerivedInputs,
} from '@/lib/valuation/inputs'
import { Segmented } from '@/components/fundamentals-grid'
import {
  formatCurrencyCompact,
  formatPercent,
  formatFairValue,
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
  inputs: DerivedInputs
}

type Model = 'two' | 'three'

/** Net borrowing above this share of FCF makes FCFE mostly a financing story. */
const FCFE_BORROWING_WARN = 0.25

export function DcfPanel({ symbol, currency, price, inputs }: DcfPanelProps) {
  const [basis, setBasis] = useState<CashFlowBasis>(inputs.defaults.basis)
  const [flavour, setFlavour] = useState<CashFlowFlavour>(inputs.defaults.flavour)
  const [model, setModel] = useState<Model>('two')
  const [assumptions, setAssumptions] = useState<DcfAssumptions>(inputs.assumptions)

  /** Base cash flow, net debt and discount rate that belong to a basis + flavour. */
  const anchorFor = (b: CashFlowBasis, f: CashFlowFlavour) => assumptionsFor(inputs, { basis: b, flavour: f })
  const anchor = anchorFor(basis, flavour) ?? inputs.assumptions

  function update<K extends keyof DcfAssumptions>(key: K, value: DcfAssumptions[K]) {
    setAssumptions((a) => ({ ...a, [key]: value }))
  }

  /** Switching basis or flavour swaps the company-derived inputs and keeps the user's growth view. */
  function choose(b: CashFlowBasis, f: CashFlowFlavour) {
    const next = anchorFor(b, f)
    if (!next) return
    setBasis(b)
    setFlavour(f)
    setAssumptions((a) => ({
      ...a,
      baseFreeCashFlow: next.baseFreeCashFlow,
      netDebt: next.netDebt,
      discountRate: next.discountRate,
    }))
  }

  function chooseModel(m: Model) {
    setModel(m)
    setAssumptions((a) =>
      m === 'three'
        ? { ...a, ...THREE_STAGE_DEFAULTS }
        : { ...a, growthYears: DEFAULT_ASSUMPTIONS.growthYears, transitionYears: 0 },
    )
  }

  function reset() {
    setBasis(inputs.defaults.basis)
    setFlavour(inputs.defaults.flavour)
    setModel('two')
    setAssumptions(inputs.assumptions)
  }

  const dirty =
    basis !== inputs.defaults.basis ||
    flavour !== inputs.defaults.flavour ||
    model !== 'two' ||
    (Object.keys(inputs.assumptions) as Array<keyof DcfAssumptions>).some(
      (k) => assumptions[k] !== inputs.assumptions[k],
    )

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

  const base = inputs.bases[basis]!
  const wacc = inputs.wacc
  const derivedRate = anchor.discountRate
  const rateName = flavour === 'fcff' ? 'WACC' : 'cost of equity'
  const horizon = assumptions.growthYears + (assumptions.transitionYears ?? 0)
  const fcfeWarning =
    flavour === 'fcfe' &&
    base.netBorrowing != null &&
    Math.abs(base.netBorrowing) > FCFE_BORROWING_WARN * Math.abs(base.freeCashFlow)

  return (
    <div className="space-y-6">
      {inputs.warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {inputs.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {/* ── Method ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <MethodControl label="Starting cash flow">
          <Segmented
            label="Starting cash flow"
            options={[
              { key: 'ttm', label: 'TTM', disabled: !anchorFor('ttm', flavour) },
              { key: 'average', label: `${inputs.fcfYearsUsed}-yr avg`, disabled: !anchorFor('average', flavour) },
            ]}
            value={basis}
            onChange={(k) => choose(k as CashFlowBasis, flavour)}
          />
        </MethodControl>
        <MethodControl label="Cash flow to">
          <Segmented
            label="Cash flow to"
            options={[
              { key: 'fcff', label: 'Firm (FCFF)' },
              { key: 'fcfe', label: 'Equity (FCFE)', disabled: !anchorFor(basis, 'fcfe') },
            ]}
            value={flavour}
            onChange={(k) => choose(basis, k as CashFlowFlavour)}
          />
        </MethodControl>
        <MethodControl label="Model">
          <Segmented
            label="Model"
            options={[
              { key: 'two', label: '2-stage' },
              { key: 'three', label: '3-stage' },
            ]}
            value={model}
            onChange={(k) => chooseModel(k as Model)}
          />
        </MethodControl>
      </div>

      {fcfeWarning && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Net borrowing of {formatCurrencyCompact(base.netBorrowing, currency)} is more than a quarter of
          free cash flow. FCFE projects that borrowing forward forever — treat this value with care.
        </p>
      )}

      {!computed.ok ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {computed.message}. The discount rate must stay above terminal growth — otherwise the
          terminal value is infinite.
        </div>
      ) : (
        // Keyed on the method so a toggle replays the settle animation —
        // the numbers just changed meaning, the eye should land on them.
        <div key={`${basis}-${flavour}-${model}`} className="motion-settle grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Readout
            label="Fair value"
            value={formatFairValue(computed.result.fairValuePerShare, currency)}
            hint={
              computed.result.fairValuePerShare <= 0
                ? 'negative cash flow — a DCF does not apply'
                : dirty
                  ? 'your assumptions'
                  : 'default assumptions'
            }
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
            hint={model === 'three' ? `reverse DCF, years 1–${assumptions.growthYears}` : 'reverse DCF — believable?'}
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
            onClick={reset}
            disabled={!dirty}
            className="text-xs text-zinc-500 underline underline-offset-4 transition enabled:hover:text-zinc-900 disabled:opacity-40 dark:enabled:hover:text-zinc-100"
          >
            Reset to defaults
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Slider
            label={model === 'three' ? 'Stage-1 growth (flat)' : 'Stage-1 growth'}
            value={assumptions.growthRate}
            min={-0.2}
            max={0.6}
            step={0.005}
            format={(v) => formatPercent(v)}
            onChange={(v) => update('growthRate', v)}
            hint={
              model === 'three'
                ? `Held for ${assumptions.growthYears} years, then fades to terminal over ${assumptions.transitionYears} years.`
                : 'Annual cash flow growth over the forecast horizon.'
            }
          />
          <Slider
            label={model === 'three' ? 'High-growth years' : 'Forecast horizon'}
            value={assumptions.growthYears}
            min={model === 'three' ? 1 : 3}
            max={model === 'three' ? 15 : 20}
            step={1}
            format={(v) => `${v} years`}
            onChange={(v) => update('growthYears', Math.round(v))}
            hint="How long you can credibly forecast this business."
          />
          {model === 'three' && (
            <Slider
              label="Transition years"
              value={assumptions.transitionYears ?? 0}
              min={1}
              max={25}
              step={1}
              format={(v) => `${v} years`}
              onChange={(v) => update('transitionYears', Math.round(v))}
              hint={`Growth walks down linearly to terminal. Explicit forecast: ${horizon} years.`}
            />
          )}
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
          <div>
            <Slider
              label="Discount rate"
              value={assumptions.discountRate}
              min={0.03}
              max={0.25}
              step={0.0025}
              format={(v) => formatPercent(v, 2)}
              onChange={(v) => update('discountRate', v)}
              hint={
                wacc
                  ? `Derived ${rateName}: ${formatPercent(derivedRate, 2)}. Must exceed terminal growth.`
                  : 'No beta on file — 10% default. Must exceed terminal growth.'
              }
            />
            {wacc && assumptions.discountRate !== derivedRate && (
              <button
                type="button"
                onClick={() => update('discountRate', derivedRate)}
                className="mt-1 text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Use derived {rateName}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
          {model === 'two' ? (
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
          ) : (
            <span />
          )}

          <BaseBreakdown
            currency={currency}
            flavour={flavour}
            label={base.label}
            freeCashFlow={base.freeCashFlow}
            adjustment={flavour === 'fcff' ? base.afterTaxInterest : base.netBorrowing}
            total={anchor.baseFreeCashFlow}
          />
        </div>

        {wacc && <WaccTable wacc={wacc} flavour={flavour} />}
      </div>

      {computed.ok && (
        <>
          {/* ── Value bridge ───────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Readout
              label="PV of forecast"
              value={formatCurrencyCompact(computed.result.pvOfForecast, currency)}
              hint={`${horizon} explicit years`}
            />
            <Readout
              label="PV of terminal value"
              value={formatCurrencyCompact(computed.result.pvOfTerminalValue, currency)}
              hint="everything after the horizon"
            />
            <Readout
              label="Equity value"
              value={formatCurrencyCompact(computed.result.equityValue, currency)}
              hint={
                flavour === 'fcfe'
                  ? 'equity cash flow is already after debt holders'
                  : `enterprise value less net debt of ${formatCurrencyCompact(assumptions.netDebt, currency)}`
              }
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
                          {cell.invalid ? MISSING : formatFairValue(cell.fairValuePerShare, currency)}
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
                    {model === 'three' && <th className="px-4 py-2 font-medium">Stage</th>}
                    <th className="px-4 py-2 text-right font-medium">Growth</th>
                    <th className="px-4 py-2 text-right font-medium">
                      {flavour === 'fcff' ? 'FCFF' : 'FCFE'}
                    </th>
                    <th className="px-4 py-2 text-right font-medium">Discount factor</th>
                    <th className="px-4 py-2 text-right font-medium">Present value</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {computed.result.years.map((y) => (
                    <tr key={y.year} className="border-t border-zinc-100 dark:border-zinc-900">
                      <td className="px-4 py-2">{y.year}</td>
                      {model === 'three' && (
                        <td className="px-4 py-2 font-sans text-xs text-zinc-500">
                          {y.stage === 1 ? 'High growth' : 'Transition'}
                        </td>
                      )}
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

function MethodControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </div>
  )
}

/** Shows how the starting cash flow was built, so the number is never a black box. */
function BaseBreakdown({
  currency,
  flavour,
  label,
  freeCashFlow,
  adjustment,
  total,
}: {
  currency: string
  flavour: CashFlowFlavour
  label: string
  freeCashFlow: number
  adjustment: number | null
  total: number
}) {
  const money = (v: number | null) => formatCurrencyCompact(v, currency)
  const adjLabel = flavour === 'fcff' ? 'after-tax interest' : 'net borrowing'
  return (
    <div className="text-right text-xs text-zinc-500">
      <div>
        Starting {flavour === 'fcff' ? 'FCFF' : 'FCFE'}{' '}
        <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{money(total)}</span> · {label}
      </div>
      <div className="mt-0.5 font-mono">
        FCF {money(freeCashFlow)}
        {adjustment == null
          ? ` · no ${adjLabel} adjustment (not reported)`
          : ` ${adjustment < 0 ? '−' : '+'} ${money(Math.abs(adjustment))} ${adjLabel}`}
      </div>
    </div>
  )
}

function WaccTable({
  wacc,
  flavour,
}: {
  wacc: NonNullable<DerivedInputs['wacc']>
  flavour: CashFlowFlavour
}) {
  const pct = (v: number) => formatPercent(v, 2)
  const rows: Array<[string, string, string]> = [
    ['Risk-free rate', pct(wacc.riskFreeRate), 'US 10-year Treasury, market assumption'],
    ['Beta', wacc.beta.toFixed(2), 'from the company profile'],
    ['Equity risk premium', pct(wacc.equityRiskPremium), 'market assumption'],
    ['Cost of equity', pct(wacc.costOfEquity), 'risk-free + beta × premium'],
    [
      'Cost of debt (pre-tax)',
      pct(wacc.preTaxCostOfDebt),
      wacc.costOfDebtSource === 'reported' ? 'interest expense ÷ total debt' : 'risk-free + 1.5% (interest not reported)',
    ],
    ['Tax rate', pct(wacc.taxRate), 'effective: tax ÷ pre-tax income'],
    ['Weights E / D', `${formatPercent(wacc.equityWeight, 0)} / ${formatPercent(wacc.debtWeight, 0)}`, 'market cap vs book debt'],
    ['WACC', pct(wacc.wacc), 'E × cost of equity + D × after-tax cost of debt'],
  ]
  return (
    <details className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-900">
      <summary className="cursor-pointer text-xs font-medium text-zinc-500">
        How the discount rate is derived ({flavour === 'fcff' ? 'WACC' : 'cost of equity'} for{' '}
        {flavour === 'fcff' ? 'cash flow to the firm' : 'cash flow to equity'})
      </summary>
      <table className="mt-3 w-full text-xs">
        <tbody>
          {rows.map(([k, v, note]) => (
            <tr key={k} className="border-t border-zinc-100 first:border-0 dark:border-zinc-900">
              <td className="py-1.5 pr-3">{k}</td>
              <td className="py-1.5 pr-3 text-right font-mono">{v}</td>
              <td className="hidden py-1.5 text-zinc-400 sm:table-cell">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {wacc.notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-amber-600 dark:text-amber-400">
          {wacc.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </details>
  )
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
