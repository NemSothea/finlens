import type { NextRequest } from 'next/server'
import { getPriceSeries, symbolsExist } from '@/lib/queries/stocks'
import { getCurrentEntitlement } from '@/lib/queries/billing'

/** GET /api/stocks/AAPL/prices?days=365 — daily closes, oldest first. */
export async function GET(request: NextRequest, ctx: RouteContext<'/api/stocks/[symbol]/prices'>) {
  const { symbol } = await ctx.params
  const { searchParams } = new URL(request.url)

  const days = Number(searchParams.get('days') ?? 365)
  if (Number.isNaN(days) || days < 1) {
    return Response.json({ error: 'days must be a positive number' }, { status: 400 })
  }

  const known = await symbolsExist([symbol])
  if (known.size === 0) {
    return Response.json({ error: `Unknown symbol: ${symbol.toUpperCase()}` }, { status: 404 })
  }

  // Clamped to the plan rather than rejected — same reasoning as financials.
  const entitlement = await getCurrentEntitlement()
  const allowedDays = Math.min(days, entitlement.limits.priceHistoryDays)

  const bars = await getPriceSeries(symbol, allowedDays)

  return Response.json({
    symbol: symbol.toUpperCase(),
    days: allowedDays,
    count: bars.length,
    truncatedByPlan: allowedDays < days,
    bars,
  })
}
