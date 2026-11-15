import { DEFAULT_ASSUMPTIONS, normaliseFreeCashFlow, type DcfAssumptions } from './dcf'
import { computeWacc, effectiveTaxRate, FALLBACK_TAX_RATE, type WaccBreakdown } from './wacc'
import { liquidCash, trailingTwelveMonths, type QuarterRow } from '@/lib/metrics'

/**
 * Derive the company-specific half of a DCF from stored fundamentals.
 *
 * One implementation, three callers: the `valuations` ingest stage, the
 * interactive panel on the detail page, and the POST valuation endpoint the
 * mobile client will use. If each derived its own base FCF or share count, the
 * same company would show three different fair values depending on where you
 * looked — the exact failure this function exists to prevent.
 *
 * Cash-flow definitions. `freeCashFlow` in this app is operating cash flow
 * minus capex. Under US GAAP operating cash flow is already AFTER interest
 * paid, so:
 *
 *   FCFF (to the firm)   = FCF + interest × (1 − tax)   → discount at WACC,
 *                                                          subtract net debt
 *   FCFE (to equity)     = FCF + net borrowing          → discount at cost of
 *                                                          equity, no net debt
 *
 * Net borrowing is the change in total debt over the same window as the base
 * (balance-sheet delta; it covers issuance, repayment and leases alike).
 */

export interface StatementInput {
  freeCashFlow: number | null
  totalDebt: number | null
  cashAndEquivalents: number | null
  /** Counted as cash for net debt. Optional: older callers may not carry it. */
  shortTermInvestments?: number | null
  sharesDiluted: number | null
  /** Needed for FCFF and the WACC; optional so thin callers still work. */
  periodEnd?: string
  interestExpense?: number | null
  incomeTax?: number | null
  netIncome?: number | null
}

export interface QuoteInput {
  price: number | null
  sharesOutstanding: number | null
  marketCap?: number | null
}

export interface DeriveContext {
  /** Quarterly statements, newest first. Enables the TTM base. */
  quarters?: QuarterRow[]
  /** Levered beta from the company profile. Enables the WACC. */
  beta?: number | null
}

export type CashFlowBasis = 'ttm' | 'average'
export type CashFlowFlavour = 'fcff' | 'fcfe'

export interface BaseCashFlow {
  basis: CashFlowBasis
  /** Human label: "TTM to 2026-09-26" / "3-year average". */
  label: string
  /** Operating cash flow − capex over the window. */
  freeCashFlow: number
  /** interest × (1 − tax) over the window; null when interest is unknown. */
  afterTaxInterest: number | null
  /** Annualised change in total debt over the window; null when unknown. */
  netBorrowing: number | null
}

export interface DerivedInputs {
  /** Default base (FCFF on the default basis) — kept for older callers. */
  baseFreeCashFlow: number
  sharesOutstanding: number
  netDebt: number
  /** Available bases. `ttm` is null without four consecutive recent quarters. */
  bases: Record<CashFlowBasis, BaseCashFlow | null>
  /** Company-derived discount rates. Null when beta or market cap is missing. */
  wacc: WaccBreakdown | null
  defaults: { basis: CashFlowBasis; flavour: CashFlowFlavour }
  /** Full assumption set for the defaults, ready for `calculateDcf`. */
  assumptions: DcfAssumptions
  /** Non-fatal data-quality notes to surface in the UI. */
  warnings: string[]
  /** How many fiscal years the average base was taken over. */
  fcfYearsUsed: number
}

export type DeriveFailure = 'no-free-cash-flow' | 'no-share-count'

export type DeriveResult =
  | { ok: true; inputs: DerivedInputs }
  | { ok: false; reason: DeriveFailure }

/** Fiscal years averaged to normalise the FCF starting point. */
export const FCF_NORMALISATION_YEARS = 3

const usable = (v: number | null | undefined): v is number => v != null && isFinite(v)

/**
 * `statements` must be newest-first annual rows (the order every query in this
 * app returns); so must `ctx.quarters`.
 *
 * Returns a typed failure rather than throwing or substituting a guess: a fair
 * value built on invented inputs is worse than no fair value, because users act
 * on these numbers.
 */
export function deriveDcfInputs(
  statements: StatementInput[],
  quote: QuoteInput | null,
  ctx: DeriveContext = {},
): DeriveResult {
  const warnings: string[] = []
  const latest = statements[0]

  // ── Average base (annual) ────────────────────────────────────────
  const fcfHistory = statements.map((s) => s.freeCashFlow)
  const avgFcf = normaliseFreeCashFlow(fcfHistory, FCF_NORMALISATION_YEARS)
  const fcfYearsUsed = fcfHistory
    .slice(0, FCF_NORMALISATION_YEARS)
    .filter((v) => v != null && isFinite(v)).length

  const average: BaseCashFlow | null =
    avgFcf == null
      ? null
      : {
          basis: 'average',
          label: `${fcfYearsUsed}-year average`,
          freeCashFlow: avgFcf,
          afterTaxInterest: averageAfterTaxInterest(statements.slice(0, fcfYearsUsed)),
          netBorrowing: annualisedDebtChange(statements, fcfYearsUsed),
        }

  // ── TTM base (quarterly) ─────────────────────────────────────────
  const ttmRow = ctx.quarters ? trailingTwelveMonths(ctx.quarters) : null
  // Same recency rule as the metrics cards: stale quarters must not override
  // a newer 10-K.
  const ttmFresh =
    ttmRow != null && (latest?.periodEnd == null || ttmRow.periodEnd >= latest.periodEnd)

  const ttm: BaseCashFlow | null =
    ttmFresh && usable(ttmRow.freeCashFlow)
      ? {
          basis: 'ttm',
          label: `TTM to ${ttmRow.periodEnd}`,
          freeCashFlow: ttmRow.freeCashFlow,
          afterTaxInterest: afterTaxInterest(ttmRow.interestExpense, ttmRow.incomeTax, ttmRow.netIncome),
          netBorrowing: debtChangeOverYear(ctx.quarters!),
        }
      : null

  if (!ttm && !average) return { ok: false, reason: 'no-free-cash-flow' }

  if (average && fcfYearsUsed < FCF_NORMALISATION_YEARS) {
    warnings.push(
      `The average base covers ${fcfYearsUsed} year${fcfYearsUsed === 1 ? '' : 's'} instead of ${FCF_NORMALISATION_YEARS} — fewer years means a noisier starting point.`,
    )
  }

  // ── Balance sheet: share count and net debt ──────────────────────
  // The freshest balance sheet wins: the TTM row carries the latest quarter's.
  const sheet = ttmFresh ? ttmRow : latest

  // Prefer the quote's share count: it is current, whereas the statement's
  // diluted count is as of the period end and misses later buybacks/issuance.
  const sharesOutstanding = quote?.sharesOutstanding ?? sheet?.sharesDiluted ?? null
  if (sharesOutstanding == null || sharesOutstanding <= 0) {
    return { ok: false, reason: 'no-share-count' }
  }
  if (quote?.sharesOutstanding == null) {
    warnings.push('Share count taken from the latest statement, not a live quote — it may be stale.')
  }
  if (sheet?.totalDebt == null) {
    warnings.push('Total debt is missing; net debt treated as cash only.')
  }

  // Same definition as the metrics card and compare table: debt minus cash
  // and short-term investments.
  const netDebt =
    (sheet?.totalDebt ?? 0) -
    (liquidCash(sheet?.cashAndEquivalents, sheet?.shortTermInvestments) ?? 0)

  // ── WACC ─────────────────────────────────────────────────────────
  const flows = ttmFresh ? ttmRow : latest
  const marketCap =
    quote?.marketCap ?? (quote?.price != null ? quote.price * sharesOutstanding : null)
  const waccResult = computeWacc({
    beta: ctx.beta ?? null,
    marketCap,
    totalDebt: sheet?.totalDebt ?? null,
    interestExpense: flows?.interestExpense ?? null,
    incomeTax: flows?.incomeTax ?? null,
    netIncome: flows?.netIncome ?? null,
  })
  const wacc = waccResult.ok ? waccResult.breakdown : null
  if (!wacc) {
    warnings.push(
      waccResult.ok === false && waccResult.reason === 'no-beta'
        ? `No beta on file, so the discount rate defaults to ${(DEFAULT_ASSUMPTIONS.discountRate * 100).toFixed(0)}% instead of a WACC.`
        : `No market cap, so the discount rate defaults to ${(DEFAULT_ASSUMPTIONS.discountRate * 100).toFixed(0)}% instead of a WACC.`,
    )
  }

  const partial = { sharesOutstanding, netDebt, bases: { ttm, average }, wacc }
  const defaults = { basis: ttm ? 'ttm' : 'average', flavour: 'fcff' } as const
  const assumptions = assumptionsFor(partial, defaults)!

  if (assumptions.baseFreeCashFlow <= 0) {
    warnings.push(
      'Base free cash flow is negative. A DCF on negative cash flow produces a negative fair value and is not meaningful for this company.',
    )
  }

  return {
    ok: true,
    inputs: {
      ...partial,
      baseFreeCashFlow: assumptions.baseFreeCashFlow,
      defaults,
      assumptions,
      warnings,
      fcfYearsUsed,
    },
  }
}

/**
 * The cash flow, discount rate and net debt that go together for a basis and
 * flavour. Shared by the panel's toggles and the API so a toggle and a POST
 * with the same choice can never disagree. Null when the combination is not
 * available (no TTM, or FCFE without debt history).
 */
export function assumptionsFor(
  inputs: Pick<DerivedInputs, 'sharesOutstanding' | 'netDebt' | 'bases' | 'wacc'>,
  choice: { basis: CashFlowBasis; flavour: CashFlowFlavour },
): DcfAssumptions | null {
  const base = inputs.bases[choice.basis]
  if (!base) return null

  const shared = {
    ...DEFAULT_ASSUMPTIONS,
    sharesOutstanding: inputs.sharesOutstanding,
  }

  if (choice.flavour === 'fcfe') {
    if (base.netBorrowing == null) return null
    return {
      ...shared,
      baseFreeCashFlow: base.freeCashFlow + base.netBorrowing,
      // Equity cash flow is already after debt holders; subtracting net debt
      // again would double count it.
      netDebt: 0,
      discountRate: round4(inputs.wacc?.costOfEquity ?? DEFAULT_ASSUMPTIONS.discountRate),
    }
  }

  return {
    ...shared,
    baseFreeCashFlow: base.freeCashFlow + (base.afterTaxInterest ?? 0),
    netDebt: inputs.netDebt,
    discountRate: round4(inputs.wacc?.wacc ?? DEFAULT_ASSUMPTIONS.discountRate),
  }
}

export function describeFailure(reason: DeriveFailure): string {
  switch (reason) {
    case 'no-free-cash-flow':
      return 'No free cash flow history — a DCF needs at least one year of cash flow data.'
    case 'no-share-count':
      return 'No share count available from either the latest quote or the statements.'
  }
}

/* ------------------------------------------------------------------ */

/** Rates snap to 0.01% so sliders (0.5% steps) and labels stay tidy. */
function round4(v: number): number {
  return Math.round(v * 10_000) / 10_000
}

function afterTaxInterest(
  interest: number | null | undefined,
  incomeTax: number | null | undefined,
  netIncome: number | null | undefined,
): number | null {
  // Zero is how vendors report "not broken out" (e.g. Apple folds it into
  // other income) — say unknown rather than claim no interest.
  if (!usable(interest) || interest === 0) return null
  const tax = effectiveTaxRate(incomeTax ?? null, netIncome ?? null) ?? FALLBACK_TAX_RATE
  return Math.abs(interest) * (1 - Math.min(Math.max(tax, 0), 0.35))
}

function averageAfterTaxInterest(rows: StatementInput[]): number | null {
  const values = rows
    .map((s) => afterTaxInterest(s.interestExpense, s.incomeTax, s.netIncome))
    .filter(usable)
  if (values.length === 0 || values.length < rows.length) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** (debt now − debt `years` fiscal years ago) ÷ years, using the rows on file. */
function annualisedDebtChange(rows: StatementInput[], years: number): number | null {
  const span = Math.min(years, rows.length - 1)
  if (span < 1) return null
  const now = rows[0].totalDebt
  const then = rows[span].totalDebt
  if (!usable(now) || !usable(then)) return null
  return (now - then) / span
}

/** Change in total debt between the newest quarter and the one a year before. */
function debtChangeOverYear(quarters: QuarterRow[]): number | null {
  const now = quarters[0]
  const then = quarters[4]
  if (!now || !then) return null
  if (!usable(now.totalDebt) || !usable(then.totalDebt)) return null
  const days = (Date.parse(now.periodEnd) - Date.parse(then.periodEnd)) / 86_400_000
  // Must really be a year apart, not a gap-ridden series.
  if (!(days >= 340 && days <= 390)) return null
  return now.totalDebt - then.totalDebt
}
