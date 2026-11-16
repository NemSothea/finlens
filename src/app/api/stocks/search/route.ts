import type { NextRequest } from 'next/server'
import { searchEverything } from '@/lib/queries/stocks'

/**
 * GET /api/stocks/search?q=apple&limit=20
 *
 * Loaded companies from Firestore, then other US-listed companies from SEC's
 * directory (`covered: false` — opening one loads it). Never calls the
 * market-data vendor, so typing costs nothing against its quota.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const limitRaw = searchParams.get('limit')

  const limit = limitRaw ? Number(limitRaw) : 20
  if (Number.isNaN(limit) || limit < 1) {
    return Response.json({ error: 'limit must be a positive number' }, { status: 400 })
  }

  // Empty query returns an empty list, not a 400 — an empty search box is a
  // normal UI state, not a client error.
  const results = await searchEverything(q, limit)

  return Response.json({ query: q, count: results.length, results })
}
