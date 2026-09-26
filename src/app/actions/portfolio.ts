'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { portfolios, transactions } from '@/db/schema'
import { auth } from '@/auth'
import { ownsPortfolio } from '@/lib/queries/user'
import { getEntitlementForUser } from '@/lib/queries/billing'
import { UPGRADE_MESSAGE } from '@/lib/billing/entitlements'
import type { ActionResult } from './watchlist'

/**
 * Resolve the caller and confirm they may use portfolio features.
 *
 * Every portfolio mutation calls this. Gating only the page would leave these
 * actions — which are public HTTP endpoints — wide open to a free account.
 */
async function requirePro(): Promise<{ userId: string } | { error: string }> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { error: 'Sign in to use a portfolio.' }

  const entitlement = await getEntitlementForUser(userId)
  if (!entitlement.limits.portfolio) return { error: UPGRADE_MESSAGE }

  return { userId }
}

/**
 * Portfolio mutations.
 *
 * The trade log is append-only in spirit: entries can be deleted (a typo has to
 * be fixable) but never edited in place, so the history that produced a position
 * always reconstructs the same numbers.
 */

const symbolSchema = z
  .string()
  .trim()
  .min(1)
  .max(12)
  .regex(/^[A-Za-z0-9.\-]+$/, 'Not a valid ticker')
  .transform((s) => s.toUpperCase())

const transactionSchema = z.object({
  portfolioId: z.number().int().positive(),
  symbol: symbolSchema,
  kind: z.enum(['buy', 'sell', 'dividend', 'split']),
  quantity: z.number().positive().max(1e12),
  // Zero is legitimate: a split carries no price, and so can a gifted share.
  pricePerShare: z.number().min(0).max(1e9),
  fees: z.number().min(0).max(1e9).default(0),
  currency: z.string().trim().length(3).toUpperCase().default('USD'),
  tradedAt: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
})

export async function createPortfolio(input: unknown): Promise<ActionResult & { id?: number }> {
  const gate = await requirePro()
  if ('error' in gate) return { ok: false, error: gate.error }
  const { userId } = gate

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(80),
      baseCurrency: z.string().trim().length(3).toUpperCase().default('USD'),
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const [created] = await db
    .insert(portfolios)
    .values({ userId, name: parsed.data.name, baseCurrency: parsed.data.baseCurrency })
    .returning({ id: portfolios.id })

  revalidatePath('/portfolio')
  return { ok: true, id: created.id }
}

export async function addTransaction(input: unknown): Promise<ActionResult> {
  const gate = await requirePro()
  if ('error' in gate) return { ok: false, error: gate.error }
  const { userId } = gate

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid trade' }
  }

  const data = parsed.data

  // Ownership is checked server-side. portfolioId arrives from the client and
  // is not trustworthy — without this, any user could append trades to anyone's
  // portfolio by changing one number.
  if (!(await ownsPortfolio(userId, data.portfolioId))) {
    return { ok: false, error: 'Portfolio not found.' }
  }

  if (data.tradedAt.getTime() > Date.now() + 86_400_000) {
    return { ok: false, error: 'Trade date is in the future.' }
  }

  if (data.kind === 'split' && data.quantity <= 0) {
    return { ok: false, error: 'A split ratio must be positive (2 = 2-for-1).' }
  }

  await db.insert(transactions).values({
    portfolioId: data.portfolioId,
    symbol: data.symbol,
    kind: data.kind,
    // numeric columns take strings — passing a JS float here would round-trip
    // through binary floating point and lose precision on large quantities.
    quantity: String(data.quantity),
    pricePerShare: String(data.pricePerShare),
    fees: String(data.fees),
    currency: data.currency,
    tradedAt: data.tradedAt,
    note: data.note ?? null,
  })

  revalidatePath('/portfolio')
  return { ok: true }
}

export async function deleteTransaction(input: unknown): Promise<ActionResult> {
  const gate = await requirePro()
  if ('error' in gate) return { ok: false, error: gate.error }
  const { userId } = gate

  const parsed = z.object({ id: z.number().int().positive() }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid transaction' }

  const [row] = await db
    .select({ portfolioId: transactions.portfolioId })
    .from(transactions)
    .where(eq(transactions.id, parsed.data.id))
    .limit(1)

  // Same response for "does not exist" and "belongs to someone else" — a
  // different message would confirm that another user's transaction id is real.
  if (!row || !(await ownsPortfolio(userId, row.portfolioId))) {
    return { ok: false, error: 'Transaction not found.' }
  }

  await db.delete(transactions).where(eq(transactions.id, parsed.data.id))

  revalidatePath('/portfolio')
  return { ok: true }
}

export async function deletePortfolio(input: unknown): Promise<ActionResult> {
  const gate = await requirePro()
  if ('error' in gate) return { ok: false, error: gate.error }
  const { userId } = gate

  const parsed = z.object({ id: z.number().int().positive() }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid portfolio' }

  // Scoped delete: the WHERE does the authorisation, so a forged id matches
  // nothing rather than deleting someone else's portfolio.
  await db
    .delete(portfolios)
    .where(and(eq(portfolios.id, parsed.data.id), eq(portfolios.userId, userId)))

  revalidatePath('/portfolio')
  return { ok: true }
}
