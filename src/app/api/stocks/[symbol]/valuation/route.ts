import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getValuationContext } from '@/lib/queries/stocks'
import { calculateDcf, marginOfSafety, reverseDcf } from '@/lib/valuation/dcf'
import { assumptionsFor, deriveDcfInputs, describeFailure } from '@/lib/valuation/inputs'
import { buildSensitivityGrid, gridSupportRatio } from '@/lib/valuation/sensitivity'
import { getCurrentEntitlement } from '@/lib/queries/billing'

/**
 * POST /api/stocks/AAPL/valuation
 * body: { basis?, flavour?, growthRate?, growthYears?, transitionYears?,
 *         terminalGrowthRate?, discountRate?, fade?, baseFreeCashFlow? }
 *
 * basis    'ttm' | 'average'  — starting cash flow window (default: TTM when fresh)
 * flavour  'fcff' | 'fcfe'    — firm (WACC, less net debt) or equity (cost of equity)
 * transitionYears > 0 switches to the three-stage model.
 * discountRate, when omitted, is the WACC (fcff) or cost of equity (fcfe).
 *
 * Recomputes a DCF under caller-supplied assumptions. The web panel runs the
 * same pure functions in the browser for instant feedback; this endpoint exists
 * so the Flutter client — which cannot import TypeScript — gets identical
 * numbers instead of a second implementation that drifts.
 */

const bodySchema = z
  .object({
    // Bounds are guardrails against nonsense, not opinions about markets:
    // -100% growth means the company evaporates, 100% forever is not a forecast.
    growthRate: z.number().min(-0.9).max(1).optional(),
    growthYears: z.number().int().min(1).max(30).optional(),
    transitionYears: z.number().int().min(0).max(30).optional(),
    basis: z.enum(['ttm', 'average']).optional(),
    flavour: z.enum(['fcff', 'fcfe']).optional(),
    terminalGrowthRate: z.number().min(-0.05).max(0.08).optional(),
    discountRate: z.number().min(0.01).max(0.5).optional(),
    fade: z.boolean().optional(),
    /** Override the normalised starting cash flow (absolute currency). */
    baseFreeCashFlow: z.number().finite().optional(),
  })
  .strict()

export async function POST(request: NextRequest, ctx: RouteContext<'/api/stocks/[symbol]/valuation'>) {
  const { symbol } = await ctx.params

  // Recomputing under custom assumptions is a Pro feature. Free users still see
  // the nightly cached fair value on the company page — the gate is on tuning
  // the model, not on knowing the number.
  const entitlement = await getCurrentEntitlement()
  if (!entitlement.limits.interactiveValuation) {
    return Response.json(
      { error: 'Custom valuation assumptions are a Pro feature.', upgrade: '/pricing' },
      { status: 402 },
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(rawBody ?? {})
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid assumptions', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const context = await getValuationContext(symbol)
  if (!context) {
    return Response.json({ error: `Unknown symbol: ${symbol.toUpperCase()}` }, { status: 404 })
  }
  const { quote } = context

  const derived = deriveDcfInputs(context.annual, quote, {
    quarters: context.quarters,
    beta: context.beta,
  })
  if (!derived.ok) {
    // 422, not 404 or 500: the ticker exists and the request was well formed,
    // but this company's data cannot support a DCF.
    return Response.json(
      { error: describeFailure(derived.reason), reason: derived.reason },
      { status: 422 },
    )
  }

  const { basis: basisIn, flavour: flavourIn, ...overrides } = parsed.data
  const choice = {
    basis: basisIn ?? derived.inputs.defaults.basis,
    flavour: flavourIn ?? derived.inputs.defaults.flavour,
  }
  const chosen = assumptionsFor(derived.inputs, choice)
  if (!chosen) {
    return Response.json(
      {
        error:
          choice.basis === 'ttm' && !derived.inputs.bases.ttm
            ? 'No trailing-twelve-month cash flow on file for this company; use basis "average".'
            : 'Not enough debt history to compute free cash flow to equity for this basis.',
        reason: 'basis-unavailable',
      },
      { status: 422 },
    )
  }

  const assumptions = { ...chosen, ...overrides }

  // Zod bounds allow a discount rate below terminal growth in isolation; only
  // the combination is invalid, so it is checked where both are known.
  if (assumptions.discountRate <= assumptions.terminalGrowthRate) {
    return Response.json(
      { error: 'discountRate must exceed terminalGrowthRate' },
      { status: 400 },
    )
  }

  const dcf = calculateDcf(assumptions)
  const price = quote?.price ?? null

  const implied = price ? reverseDcf({ ...assumptions, currentPrice: price }) : null
  const grid = buildSensitivityGrid(assumptions, price)

  return Response.json({
    symbol: symbol.toUpperCase(),
    price,
    assumptions,
    basis: choice.basis,
    flavour: choice.flavour,
    bases: derived.inputs.bases,
    wacc: derived.inputs.wacc,
    warnings: derived.inputs.warnings,
    fcfYearsUsed: derived.inputs.fcfYearsUsed,
    result: {
      fairValuePerShare: dcf.fairValuePerShare,
      equityValue: dcf.equityValue,
      enterpriseValue: dcf.enterpriseValue,
      pvOfForecast: dcf.pvOfForecast,
      pvOfTerminalValue: dcf.pvOfTerminalValue,
      terminalValue: dcf.terminalValue,
      terminalValueShare: dcf.terminalValueShare,
      years: dcf.years,
    },
    marginOfSafety: price ? marginOfSafety(dcf.fairValuePerShare, price) : null,
    reverseDcf: implied,
    sensitivity: { ...grid, supportRatio: gridSupportRatio(grid, price) },
  })
}
