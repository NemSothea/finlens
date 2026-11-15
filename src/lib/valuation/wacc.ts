/**
 * Discount rates derived from the company instead of a flat 10%.
 *
 *   cost of equity = risk-free rate + beta × equity risk premium   (CAPM)
 *   cost of debt   = interest expense ÷ total debt                 (pre-tax)
 *   tax rate       = income tax ÷ (net income + income tax)        (effective)
 *   WACC           = E/(D+E) × cost of equity + D/(D+E) × cost of debt × (1 − tax)
 *
 * E is market capitalisation, D is book total debt (market value of debt is
 * not available from statements; for investment-grade issuers the two are
 * close). Every input that had to be clamped or defaulted is reported in
 * `notes`, so the panel can show where the number came from.
 *
 * Pure functions, no I/O.
 */

/**
 * Market-wide assumptions, not company data. Stated, editable in one place,
 * and surfaced in the UI — a WACC built on hidden constants is as opaque as
 * the flat 10% it replaces.
 *
 * Risk-free: US 10-year Treasury yield, rounded. Equity risk premium: implied
 * S&P 500 premium in the 4–5% range that Damodaran's series has sat in for
 * years. Update both when markets move materially.
 */
export const MARKET_ASSUMPTIONS = {
  riskFreeRate: 0.0425,
  equityRiskPremium: 0.045,
} as const

/** Used when the effective tax rate cannot be computed (losses, missing lines). */
export const FALLBACK_TAX_RATE = 0.21
/** Spread over risk-free when cost of debt cannot be computed. */
export const FALLBACK_DEBT_SPREAD = 0.015

const BETA_RANGE = [0.3, 3] as const
const TAX_RANGE = [0, 0.35] as const
const COST_OF_DEBT_RANGE = [0.01, 0.15] as const

export interface WaccInput {
  beta: number | null
  /** Market value of equity. */
  marketCap: number | null
  totalDebt: number | null
  /** Annual (TTM or FY) interest expense. Sign is ignored — vendors disagree. */
  interestExpense: number | null
  /** Annual income tax expense and net income, for the effective tax rate. */
  incomeTax: number | null
  netIncome: number | null
  riskFreeRate?: number
  equityRiskPremium?: number
}

export interface WaccBreakdown {
  riskFreeRate: number
  equityRiskPremium: number
  /** Beta as used, after clamping. */
  beta: number
  costOfEquity: number
  preTaxCostOfDebt: number
  /** 'reported' = interest ÷ debt; 'fallback' = risk-free + spread. */
  costOfDebtSource: 'reported' | 'fallback'
  taxRate: number
  afterTaxCostOfDebt: number
  equityWeight: number
  debtWeight: number
  wacc: number
  notes: string[]
}

export type WaccResult =
  | { ok: true; breakdown: WaccBreakdown }
  | { ok: false; reason: 'no-beta' | 'no-market-cap' }

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))
const usable = (v: number | null | undefined): v is number => v != null && isFinite(v)

export function effectiveTaxRate(incomeTax: number | null, netIncome: number | null): number | null {
  if (!usable(incomeTax) || !usable(netIncome)) return null
  const pretax = netIncome + incomeTax
  // A loss year, or a tax benefit, has no meaningful "rate".
  if (pretax <= 0 || incomeTax < 0) return null
  return incomeTax / pretax
}

export function computeWacc(input: WaccInput): WaccResult {
  const rf = input.riskFreeRate ?? MARKET_ASSUMPTIONS.riskFreeRate
  const erp = input.equityRiskPremium ?? MARKET_ASSUMPTIONS.equityRiskPremium
  const notes: string[] = []

  // Exactly 0 is how vendors (and z.coerce on null) spell "unknown".
  if (!usable(input.beta) || input.beta === 0) return { ok: false, reason: 'no-beta' }
  if (!usable(input.marketCap) || input.marketCap <= 0) return { ok: false, reason: 'no-market-cap' }

  const beta = clamp(input.beta, BETA_RANGE)
  if (beta !== input.beta) {
    notes.push(`Beta ${input.beta.toFixed(2)} is outside ${BETA_RANGE[0]}–${BETA_RANGE[1]}; clamped to ${beta}.`)
  }
  const costOfEquity = rf + beta * erp

  const rawTax = effectiveTaxRate(input.incomeTax, input.netIncome)
  let taxRate: number
  if (rawTax == null) {
    taxRate = FALLBACK_TAX_RATE
    notes.push(`Effective tax rate not computable; using ${(FALLBACK_TAX_RATE * 100).toFixed(0)}%.`)
  } else {
    taxRate = clamp(rawTax, TAX_RANGE)
    if (taxRate !== rawTax) notes.push(`Effective tax rate ${(rawTax * 100).toFixed(1)}% clamped to ${(taxRate * 100).toFixed(1)}%.`)
  }

  const debt = usable(input.totalDebt) && input.totalDebt > 0 ? input.totalDebt : 0
  let preTaxCostOfDebt: number
  let costOfDebtSource: 'reported' | 'fallback' = 'reported'
  const interest = usable(input.interestExpense) ? Math.abs(input.interestExpense) : null
  if (debt > 0 && interest != null && interest > 0) {
    const raw = interest / debt
    preTaxCostOfDebt = clamp(raw, COST_OF_DEBT_RANGE)
    if (preTaxCostOfDebt !== raw) {
      notes.push(`Implied cost of debt ${(raw * 100).toFixed(1)}% clamped to ${(preTaxCostOfDebt * 100).toFixed(1)}%.`)
    }
  } else {
    preTaxCostOfDebt = rf + FALLBACK_DEBT_SPREAD
    costOfDebtSource = 'fallback'
    if (debt > 0) notes.push('Interest expense not reported (zero or missing); cost of debt set to risk-free + 1.5%.')
  }

  const afterTaxCostOfDebt = preTaxCostOfDebt * (1 - taxRate)
  const total = input.marketCap + debt
  const equityWeight = input.marketCap / total
  const debtWeight = debt / total
  const wacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt

  return {
    ok: true,
    breakdown: {
      riskFreeRate: rf,
      equityRiskPremium: erp,
      beta,
      costOfEquity,
      preTaxCostOfDebt,
      costOfDebtSource,
      taxRate,
      afterTaxCostOfDebt,
      equityWeight,
      debtWeight,
      wacc,
      notes,
    },
  }
}
