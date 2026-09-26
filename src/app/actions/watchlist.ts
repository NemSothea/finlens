'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { refs, type WatchlistItemDoc } from '@/db/schema'
import { auth } from '@/auth'
import { symbolsExist } from '@/lib/queries/stocks'
import { countWatchlist } from '@/lib/queries/user'
import { getEntitlementForUser } from '@/lib/queries/billing'
import { checkWatchlistLimit } from '@/lib/billing/entitlements'

/**
 * Watchlist mutations.
 *
 * Server Actions are public HTTP endpoints — the form they are called from is
 * not a security boundary. Every action re-reads the session and validates its
 * input here; nothing trusts a hidden field or a client-supplied user id.
 */

export type ActionResult = { ok: true } | { ok: false; error: string }

const symbolSchema = z
  .string()
  .trim()
  .min(1)
  .max(12)
  // Ticker charset: letters, digits, dot and dash (BRK-B, 7203.T). Also what
  // keeps a symbol safe to use as a document id.
  .regex(/^[A-Za-z0-9.\-]+$/, 'Not a valid ticker')
  .transform((s) => s.toUpperCase())

const addSchema = z.object({
  symbol: symbolSchema,
  note: z.string().trim().max(500).optional(),
  targetPrice: z.number().positive().max(1e9).optional(),
})

export async function addToWatchlist(input: unknown): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Sign in to use a watchlist.' }

  const parsed = addSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { symbol, note, targetPrice } = parsed.data

  const known = await symbolsExist([symbol])
  if (known.size === 0) {
    return { ok: false, error: `${symbol} is not in our universe yet.` }
  }

  const itemRef = refs.watchlistItem(userId, symbol)

  // Adding a symbol twice is a no-op, not an error — the user's intent
  // ("watch this") is already satisfied. It must also not be blocked by the
  // limit: it changes nothing, and failing it would be baffling at the boundary.
  if ((await itemRef.get()).exists) {
    return { ok: true }
  }

  // Plan limit enforced here, in the mutation — not by hiding the button. This
  // action is a public HTTP endpoint and is also what the JSON API calls.
  const entitlement = await getEntitlementForUser(userId)
  if (!entitlement.limits.watchlistSize || entitlement.limits.watchlistSize < Infinity) {
    const check = checkWatchlistLimit(entitlement, await countWatchlist(userId))
    if (!check.allowed) return { ok: false, error: check.message ?? 'Watchlist is full.' }
  }

  const doc: WatchlistItemDoc = {
    symbol,
    note: note ?? null,
    targetPrice: targetPrice ?? null,
    addedAt: new Date(),
  }

  try {
    // create(), not set(): a concurrent add of the same symbol loses the race
    // cleanly instead of overwriting the first add's timestamp.
    await itemRef.create(doc)
  } catch (error) {
    if ((error as { code?: number }).code !== 6 /* ALREADY_EXISTS */) throw error
  }

  revalidatePath('/watchlist')
  revalidatePath(`/stocks/${symbol}`)
  return { ok: true }
}

export async function removeFromWatchlist(input: unknown): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Sign in to use a watchlist.' }

  const parsed = symbolSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid ticker' }

  const symbol = parsed.data

  // The path is under users/{userId}, so this can only ever delete the
  // caller's own entry.
  await refs.watchlistItem(userId, symbol).delete()

  revalidatePath('/watchlist')
  revalidatePath(`/stocks/${symbol}`)
  return { ok: true }
}

export async function toggleWatchlist(input: unknown): Promise<ActionResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Sign in to use a watchlist.' }

  const parsed = symbolSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid ticker' }

  const existing = await refs.watchlistItem(userId, parsed.data).get()

  return existing.exists ? removeFromWatchlist(parsed.data) : addToWatchlist({ symbol: parsed.data })
}
