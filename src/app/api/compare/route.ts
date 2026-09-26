import type { NextRequest } from 'next/server'
import { getSnapshots } from '@/lib/queries/stocks'
import { getCurrentEntitlement } from '@/lib/queries/billing'

/**
 * GET /api/compare?symbols=AAPL,MSFT — up to `limits.compareSymbols`
 * snapshots, same shape as the detail endpoint.
 *
 * Lives at /api/compare rather than /api/stocks/compare on purpose: the latter
 * sits under the `[symbol]` dynamic segment and would permanently shadow any
 * ticker literally named COMPARE. Static-beats-dynamic collisions are cheap to
 * avoid now and confusing to debug later.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('symbols') ?? ''

  const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (symbols.length < 2) {
    return Response.json({ error: 'Provide at least 2 symbols, e.g. ?symbols=AAPL,MSFT' }, { status: 400 })
  }

  // Clamp to the plan before querying, same as the /compare page — the extra
  // symbols must never be fetched, or they can be read back out of the payload.
  const { limits } = await getCurrentEntitlement()
  const allowed = symbols.slice(0, limits.compareSymbols)

  const items = await getSnapshots(allowed)

  const found = new Set(items.map((i) => i.company.symbol))
  const missing = allowed.map((s) => s.toUpperCase()).filter((s) => !found.has(s))

  // 200 with an explicit `missing` list rather than 404: comparing 2 of 3
  // requested tickers is still a useful answer, and the client needs to know
  // which one it did not get.
  return Response.json({
    count: items.length,
    missing,
    truncatedByPlan: allowed.length < symbols.length,
    compareLimit: limits.compareSymbols,
    items,
  })
}
