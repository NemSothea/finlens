import type { NextRequest } from 'next/server'
import { searchCompanies } from '@/lib/queries/stocks'

/**
 * GET /api/stocks/search?q=apple&limit=20
 *
 * Reads our own Postgres, never a vendor. Same query function the RSC pages
 * use — the Flutter client and the web UI cannot drift apart.
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
  const results = await searchCompanies(q, limit)

  return Response.json({ query: q, count: results.length, results })
}
