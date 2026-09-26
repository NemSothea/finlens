import type { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { getWatchlist } from '@/lib/queries/user'
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist'

/**
 * Watchlist for API clients (the Flutter app in §8 of the plan).
 *
 * Reads the same query and calls the same mutations as the web pages, so the
 * two surfaces cannot diverge in behaviour or validation.
 *
 * Auth is the Auth.js session cookie. The mobile client will need a bearer
 * token instead — that lands with M4, and this handler is where it plugs in.
 */

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const items = await getWatchlist(session.user.id)
  return Response.json({ count: items.length, items })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  const result = await addToWatchlist(body)
  if (!result.ok) {
    // The action returns one message for both auth and validation failures, so
    // the status is chosen from the session rather than by parsing the string.
    const session = await auth()
    return Response.json({ error: result.error }, { status: session?.user ? 400 : 401 })
  }

  return Response.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) return Response.json({ error: 'symbol is required' }, { status: 400 })

  const result = await removeFromWatchlist(symbol)
  if (!result.ok) {
    const session = await auth()
    return Response.json({ error: result.error }, { status: session?.user ? 400 : 401 })
  }

  return Response.json({ ok: true })
}
