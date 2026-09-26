'use server'

import { revalidatePath } from 'next/cache'
import { and, countDistinct, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { watchlistItems } from '@/db/schema'
import { auth } from '@/auth'
import { symbolsExist } from '@/lib/queries/stocks'
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
  // Ticker charset: letters, digits, dot and dash (BRK-B, 7203.T).
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

  // The table has a foreign key to companies; checking first turns a raw
  // constraint violation into a message the user can act on.
  const known = await symbolsExist([symbol])
  if (known.size === 0) {
    return { ok: false, error: `${symbol} is not in our universe yet.` }
  }

  // Plan limit enforced here, in the mutation — not by hiding the button. This
  // action is a public HTTP endpoint and is also what the JSON API calls.
  const entitlement = await getEntitlementForUser(userId)
  if (!entitlement.limits.watchlistSize || entitlement.limits.watchlistSize < Infinity) {
    const [{ count }] = await db
      .select({ count: countDistinct(watchlistItems.symbol) })
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))

    // Re-adding something already watched must not be blocked by the limit —
    // it changes nothing, and failing it would be baffling at the boundary.
    const alreadyWatched = await db
      .select({ id: watchlistItems.id })
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.symbol, symbol)))
      .limit(1)

    if (alreadyWatched.length === 0) {
      const check = checkWatchlistLimit(entitlement, Number(count))
      if (!check.allowed) return { ok: false, error: check.message ?? 'Watchlist is full.' }
    }
  }

  await db
    .insert(watchlistItems)
    .values({
      userId,
      symbol,
      note: note ?? null,
      targetPrice: targetPrice == null ? null : String(targetPrice),
    })
    // Adding a symbol twice is a no-op, not an error — the user's intent
    // ("watch this") is already satisfied.
    .onConflictDoNothing({ target: [watchlistItems.userId, watchlistItems.symbol] })

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

  // Scoped by userId as well as symbol: without it, any signed-in user could
  // delete another account's row by guessing a ticker.
  await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.symbol, symbol)))

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

  const [existing] = await db
    .select({ id: watchlistItems.id })
    .from(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.symbol, parsed.data)))
    .limit(1)

  return existing ? removeFromWatchlist(parsed.data) : addToWatchlist({ symbol: parsed.data })
}
