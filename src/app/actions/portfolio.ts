'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { refs, type PortfolioDoc, type TransactionDoc } from '@/db/schema'
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

/** Ids become Firestore path segments, so they are held to the charset we
 *  issue — never a `/` or `..` that could point somewhere else. */
const docIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id')

const transactionSchema = z.object({
  portfolioId: docIdSchema,
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

export async function createPortfolio(input: unknown): Promise<ActionResult & { id?: string }> {
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

  const doc: PortfolioDoc = {
    name: parsed.data.name,
    baseCurrency: parsed.data.baseCurrency,
    createdAt: new Date(),
  }
  const created = await refs.portfolios(userId).add(doc)

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

  // portfolioId arrives from the client. The lookup is under users/{userId},
  // so another user's portfolio id simply does not exist from here.
  if (!(await ownsPortfolio(userId, data.portfolioId))) {
    return { ok: false, error: 'Portfolio not found.' }
  }

  if (data.tradedAt.getTime() > Date.now() + 86_400_000) {
    return { ok: false, error: 'Trade date is in the future.' }
  }

  if (data.kind === 'split' && data.quantity <= 0) {
    return { ok: false, error: 'A split ratio must be positive (2 = 2-for-1).' }
  }

  const doc: TransactionDoc = {
    symbol: data.symbol,
    kind: data.kind,
    quantity: data.quantity,
    pricePerShare: data.pricePerShare,
    fees: data.fees,
    currency: data.currency,
    tradedAt: data.tradedAt,
    note: data.note ?? null,
    createdAt: new Date(),
  }
  await refs.transactions(userId, data.portfolioId).add(doc)

  revalidatePath('/portfolio')
  return { ok: true }
}

export async function deleteTransaction(input: unknown): Promise<ActionResult> {
  const gate = await requirePro()
  if ('error' in gate) return { ok: false, error: gate.error }
  const { userId } = gate

  const parsed = z.object({ portfolioId: docIdSchema, id: docIdSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid transaction' }

  const ref = refs.transactions(userId, parsed.data.portfolioId).doc(parsed.data.id)

  // Same response for "does not exist" and "belongs to someone else" — and
  // under this path, someone else's transaction cannot exist anyway.
  if (!(await ref.get()).exists) {
    return { ok: false, error: 'Transaction not found.' }
  }

  await ref.delete()

  revalidatePath('/portfolio')
  return { ok: true }
}

export async function deletePortfolio(input: unknown): Promise<ActionResult> {
  const gate = await requirePro()
  if ('error' in gate) return { ok: false, error: gate.error }
  const { userId } = gate

  const parsed = z.object({ id: docIdSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid portfolio' }

  // Firestore does not cascade: deleting the portfolio doc alone would orphan
  // its transactions. recursiveDelete removes the subcollection with it.
  await db.recursiveDelete(refs.portfolio(userId, parsed.data.id))

  revalidatePath('/portfolio')
  return { ok: true }
}
