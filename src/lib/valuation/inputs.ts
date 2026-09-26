import { DEFAULT_ASSUMPTIONS, normaliseFreeCashFlow, type DcfAssumptions } from './dcf'

/**
 * Derive the company-specific half of a DCF from stored fundamentals.
 *
 * One implementation, three callers: the `valuations` ingest stage, the
 * interactive panel on the detail page, and the POST valuation endpoint the
 * mobile client will use. If each derived its own base FCF or share count, the
 * same company would show three different fair values depending on where you
 * looked — the exact failure this function exists to prevent.
 */

export interface StatementInput {
  freeCashFlow: number | null
  totalDebt: number | null
  cashAndEquivalents: number | null
  sharesDiluted: number | null
}

export interface QuoteInput {
  price: number | null
  sharesOutstanding: number | null
}

export interface DerivedInputs {
  /** The company-specific inputs — not the user-tunable rates. */
  baseFreeCashFlow: number
  sharesOutstanding: number
  netDebt: number
  /** Full assumption set with defaults applied, ready for `calculateDcf`. */
  assumptions: DcfAssumptions
  /** Non-fatal data-quality notes to surface in the UI. */
  warnings: string[]
  /** How many fiscal years the base FCF was averaged over. */
  fcfYearsUsed: number
}

export type DeriveFailure =
  | 'no-free-cash-flow'
  | 'no-share-count'

export type DeriveResult =
  | { ok: true; inputs: DerivedInputs }
  | { ok: false; reason: DeriveFailure }

/** Fiscal years averaged to normalise the FCF starting point. */
export const FCF_NORMALISATION_YEARS = 3

/**
 * `statements` must be newest-first (the order every query in this app returns).
 *
 * Returns a typed failure rather than throwing or substituting a guess: a fair
 * value built on invented inputs is worse than no fair value, because users act
 * on these numbers.
 */
export function deriveDcfInputs(
  statements: StatementInput[],
  quote: QuoteInput | null,
): DeriveResult {
  const warnings: string[] = []

  const fcfHistory = statements.map((s) => s.freeCashFlow)
  const baseFreeCashFlow = normaliseFreeCashFlow(fcfHistory, FCF_NORMALISATION_YEARS)

  if (baseFreeCashFlow == null) return { ok: false, reason: 'no-free-cash-flow' }

  const fcfYearsUsed = fcfHistory
    .slice(0, FCF_NORMALISATION_YEARS)
    .filter((v) => v != null && isFinite(v)).length

  if (fcfYearsUsed < FCF_NORMALISATION_YEARS) {
    warnings.push(
      `Base free cash flow averaged over ${fcfYearsUsed} year${fcfYearsUsed === 1 ? '' : 's'} instead of ${FCF_NORMALISATION_YEARS} — fewer years means a noisier starting point.`,
    )
  }

  if (baseFreeCashFlow <= 0) {
    warnings.push(
      'Normalised free cash flow is negative. A DCF on negative cash flow produces a negative fair value and is not meaningful for this company.',
    )
  }

  const latest = statements[0]

  // Prefer the quote's share count: it is current, whereas the statement's
  // diluted count is as of the fiscal year end and misses subsequent buybacks
  // and issuance.
  const sharesOutstanding = quote?.sharesOutstanding ?? latest?.sharesDiluted ?? null
  if (sharesOutstanding == null || sharesOutstanding <= 0) {
    return { ok: false, reason: 'no-share-count' }
  }

  if (quote?.sharesOutstanding == null) {
    warnings.push(
      'Share count taken from the latest annual statement, not a live quote — it may be stale.',
    )
  }

  if (latest?.totalDebt == null) {
    warnings.push('Total debt is missing; net debt treated as cash only.')
  }

  const netDebt = (latest?.totalDebt ?? 0) - (latest?.cashAndEquivalents ?? 0)

  return {
    ok: true,
    inputs: {
      baseFreeCashFlow,
      sharesOutstanding,
      netDebt,
      assumptions: { baseFreeCashFlow, sharesOutstanding, netDebt, ...DEFAULT_ASSUMPTIONS },
      warnings,
      fcfYearsUsed,
    },
  }
}

export function describeFailure(reason: DeriveFailure): string {
  switch (reason) {
    case 'no-free-cash-flow':
      return 'No free cash flow history — a DCF needs at least one year of cash flow data.'
    case 'no-share-count':
      return 'No share count available from either the latest quote or the annual statements.'
  }
}
