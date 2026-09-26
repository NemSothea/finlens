import type { NextRequest } from 'next/server'
import { getStockSnapshot } from '@/lib/queries/stocks'

/** GET /api/stocks/AAPL — profile, quote, cached valuation, latest FY, derived metrics. */
export async function GET(_request: NextRequest, ctx: RouteContext<'/api/stocks/[symbol]'>) {
  const { symbol } = await ctx.params

  const snapshot = await getStockSnapshot(symbol)
  if (!snapshot) {
    return Response.json({ error: `Unknown symbol: ${symbol.toUpperCase()}` }, { status: 404 })
  }

  return Response.json(snapshot)
}
