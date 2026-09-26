'use server'

import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { db } from '@/db'
import { payments, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { getActiveProviderName, getPaymentProvider } from '@/lib/payments/registry'
import { PLAN_PRICES, PaymentConfigError, type PlanId } from '@/lib/payments/types'

export type CheckoutResult =
  | { ok: true; reference: string; redirectUrl: string | null; formAction?: string; formFields?: Record<string, string> }
  | { ok: false; error: string }

const planSchema = z.enum(['pro_monthly', 'pro_annual'])

/**
 * Start a purchase.
 *
 * The `payments` row is written BEFORE the user leaves for the provider. That
 * ordering is the whole point: the webhook may arrive before the browser comes
 * back — or the browser may never come back at all — and without a row to match
 * the reference against, a completed payment has nowhere to land.
 *
 * Price comes from `PLAN_PRICES`, never from the client. A caller who could
 * name their own amount would name zero.
 */
export async function startCheckout(input: unknown): Promise<CheckoutResult> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: 'Sign in to subscribe.' }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Choose a valid plan.' }

  const plan: PlanId = parsed.data
  const price = PLAN_PRICES[plan]

  const providerName = getActiveProviderName()

  let provider
  try {
    provider = getPaymentProvider(providerName)
  } catch (error) {
    if (error instanceof PaymentConfigError) {
      console.error(`[checkout] ${error.message}`)
      return { ok: false, error: 'Payments are not configured yet. Please try again later.' }
    }
    throw error
  }

  // Unique per attempt, and unguessable. A sequential reference would let
  // anyone probe other people's transactions through the callback URL.
  const reference = `fl_${randomUUID().replace(/-/g, '')}`

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  await db.insert(payments).values({
    userId,
    provider: providerName,
    reference,
    plan,
    amount: String(price.amount),
    currency: price.currency,
    status: 'pending',
  })

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'

  const checkout = await provider.createCheckout({
    reference,
    plan,
    amount: price.amount,
    currency: price.currency,
    userId,
    email: user?.email ?? null,
    returnUrl: `${baseUrl}/pricing?checkout=${reference}`,
    callbackUrl: `${baseUrl}/api/payments/webhook/${providerName}`,
  })

  return {
    ok: true,
    reference,
    redirectUrl: checkout.redirectUrl,
    formAction: checkout.formAction,
    formFields: checkout.formFields,
  }
}
