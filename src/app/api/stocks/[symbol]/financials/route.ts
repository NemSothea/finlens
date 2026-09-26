import type { NextRequest } from 'next/server'
import { getStatements, symbolsExist } from '@/lib/queries/stocks'
import { getCurrentEntitlement } from '@/lib/queries/billing'

/** GET /api/stocks/AAPL/financials?period=FY&years=15 — statements newest first. */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/stocks/[symbol]/financials'>,
) {
  const { symbol } = await ctx.params
  const { searchParams } = new URL(request.url)

  const period = (searchParams.get('period') ?? 'FY').toUpperCase()
  if (period !== 'FY' && period !== 'Q') {
    return Response.json({ error: "period must be 'FY' or 'Q'" }, { status: 400 })
  }

  const years = Number(searchParams.get('years') ?? 15)
  if (Number.isNaN(years) || years < 1) {
    return Response.json({ error: 'years must be a positive number' }, { status: 400 })
  }

  // Clamp to the plan, do not reject. A free client asking for 30 years gets 5
  // and is told so — an error here would just push callers to guess the limit.
  const entitlement = await getCurrentEntitlement()
  const allowedYears = Math.min(years, entitlement.limits.financialYears)

  // Distinguish "unknown ticker" (404) from "known ticker, no statements yet"
  // (200 + empty array). The mobile client renders a different state for each.
  const known = await symbolsExist([symbol])
  if (known.size === 0) {
    return Response.json({ error: `Unknown symbol: ${symbol.toUpperCase()}` }, { status: 404 })
  }

  const statements = await getStatements(symbol, period, allowedYears)

  return Response.json({
    symbol: symbol.toUpperCase(),
    period,
    count: statements.length,
    // Tell the client the request was trimmed rather than silently returning
    // less than it asked for.
    truncatedByPlan: allowedYears < years,
    yearsAvailableOnPlan: entitlement.limits.financialYears,
    statements,
  })
}
