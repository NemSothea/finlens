import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { getQuote, getStatements, symbolsExist } from '@/lib/queries/stocks'
import { calculateDcf, marginOfSafety, reverseDcf } from '@/lib/valuation/dcf'
import { deriveDcfInputs, describeFailure } from '@/lib/valuation/inputs'
import { buildSensitivityGrid, gridSupportRatio } from '@/lib/valuation/sensitivity'
import { getCurrentEntitlement } from '@/lib/queries/billing'

/**
 * POST /api/stocks/AAPL/valuation
 * body: { growthRate?, growthYears?, terminalGrowthRate?, discountRate?, fade?, baseFreeCashFlow? }
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

  const known = await symbolsExist([symbol])
  if (known.size === 0) {
    return Response.json({ error: `Unknown symbol: ${symbol.toUpperCase()}` }, { status: 404 })
  }

  const [statements, quote] = await Promise.all([
    getStatements(symbol, 'FY', 10),
    getQuote(symbol),
  ])

  const derived = deriveDcfInputs(statements, quote)
  if (!derived.ok) {
    // 422, not 404 or 500: the ticker exists and the request was well formed,
    // but this company's data cannot support a DCF.
    return Response.json(
      { error: describeFailure(derived.reason), reason: derived.reason },
      { status: 422 },
    )
  }

  const assumptions = { ...derived.inputs.assumptions, ...parsed.data }

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
