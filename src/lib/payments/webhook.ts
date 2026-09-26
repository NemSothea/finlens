import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { paymentEvents, payments, subscriptions } from '@/db/schema'
import { PLAN_PRICES, type NormalisedEvent, type PlanId } from './types'
import { amountMatches, applyPaymentEvent, nextPaymentStatus } from './transitions'

/**
 * Webhook processing.
 *
 * Providers retry aggressively, deliver out of order, and occasionally send the
 * same event several times. The rules that make that survivable:
 *
 * 1. **The ledger insert is the lock.** Every event is written to
 *    `payment_events` first, keyed by `(provider, event_id)`. A duplicate hits
 *    the unique index, and the handler stops there — the subscription is never
 *    extended twice.
 * 2. **The amount is checked against our own price**, not trusted from the
 *    callback. Otherwise a $0.01 payment buys a month.
 * 3. **The plan comes from our `payments` row**, not the callback. The caller
 *    does not get to pick what they bought.
 */

export type WebhookResult =
  | { status: 'applied'; userId: string; plan: PlanId }
  | { status: 'duplicate' }
  | { status: 'ignored'; reason: string }

export async function processPaymentEvent(
  providerName: string,
  event: NormalisedEvent,
  now: Date = new Date(),
): Promise<WebhookResult> {
  // Claim and apply in ONE transaction.
  //
  // Claiming outside it would be worse than useless: a crash between the claim
  // and the subscription update would leave the event marked as seen, so the
  // provider's retry would be deduped and the customer would never get the
  // access they paid for. Rolling back the claim with the work means a retry
  // genuinely re-processes.
  return db.transaction(async (tx) => processInTransaction(tx, providerName, event, now))
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function processInTransaction(
  db: Tx,
  providerName: string,
  event: NormalisedEvent,
  now: Date,
): Promise<WebhookResult> {
  // ── 1. Claim the event. This is the idempotency barrier. ──────────
  const [claimed] = await db
    .insert(paymentEvents)
    .values({
      provider: providerName,
      eventId: event.eventId,
      type: event.type,
      reference: event.reference,
      payload: event.raw as object,
    })
    .onConflictDoNothing({
      target: [paymentEvents.provider, paymentEvents.eventId],
    })
    .returning({ id: paymentEvents.id })

  // Nothing returned means this exact event was already recorded. Stop before
  // touching the subscription — this is what makes replay safe.
  if (!claimed) return { status: 'duplicate' }

  const finish = async (result: string, error?: string) => {
    await db
      .update(paymentEvents)
      .set({ processedAt: new Date(), result, error: error ?? null })
      .where(eq(paymentEvents.id, claimed.id))
  }

  // ── 2. Find the purchase this event belongs to. ──────────────────
  if (!event.reference) {
    await finish('ignored', 'event carried no reference')
    return { status: 'ignored', reason: 'no reference' }
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, providerName), eq(payments.reference, event.reference)))
    .limit(1)

  if (!payment) {
    // A callback for a purchase we never created. Recorded for investigation
    // rather than acted on — this is either a bug or a forged reference.
    await finish('ignored', `no payment for reference ${event.reference}`)
    return { status: 'ignored', reason: 'unknown reference' }
  }

  const plan = payment.plan as PlanId
  const price = PLAN_PRICES[plan]

  if (!price) {
    await finish('error', `payment row carries unknown plan ${payment.plan}`)
    return { status: 'ignored', reason: 'unknown plan' }
  }

  // ── 3. Verify the money. ─────────────────────────────────────────
  // Underpayment must never grant access, so a success event whose amount does
  // not match our price is downgraded to a failure rather than honoured.
  if (event.type === 'payment.succeeded' && !amountMatches(price.amount, event.amount)) {
    // Only a purchase still awaiting settlement is marked failed. A row that
    // already cleared stays `paid` — a late underpaid callback must not rewrite
    // the receipt for money that did arrive.
    const ledgerStatus = nextPaymentStatus(payment.status, 'failed')

    if (ledgerStatus) {
      await db
        .update(payments)
        .set({ status: ledgerStatus, updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
    }

    await finish('ignored', `amount mismatch: expected ${price.amount}, got ${event.amount}`)
    return { status: 'ignored', reason: 'amount mismatch' }
  }

  // ── 4. Apply the transition. ─────────────────────────────────────
  const [current] = await db
    .select({
      plan: subscriptions.plan,
      status: subscriptions.status,
      provider: subscriptions.provider,
      providerRef: subscriptions.providerRef,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, payment.userId))
    .limit(1)

  const outcome = applyPaymentEvent({
    event,
    plan,
    provider: providerName,
    current: current ?? null,
    now,
  })

  if (outcome.action === 'ignore') {
    await finish('ignored', outcome.reason)
    return { status: 'ignored', reason: outcome.reason }
  }

  const { next, paymentStatus } = outcome

  await db
    .insert(subscriptions)
    .values({
      userId: payment.userId,
      plan: next.plan,
      status: next.status,
      provider: next.provider,
      providerRef: next.providerRef,
      currentPeriodEnd: next.currentPeriodEnd,
      cancelAtPeriodEnd: next.cancelAtPeriodEnd,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: next.plan,
        status: next.status,
        provider: next.provider,
        providerRef: next.providerRef,
        currentPeriodEnd: next.currentPeriodEnd,
        cancelAtPeriodEnd: next.cancelAtPeriodEnd,
        updatedAt: new Date(),
      },
    })

  // The subscription has already moved; the ledger row only follows when the
  // move is a legal one. A failed renewal leaves the original `paid` receipt
  // intact while the subscription still goes `past_due`.
  const ledgerStatus = nextPaymentStatus(payment.status, paymentStatus)

  await db
    .update(payments)
    .set({
      ...(ledgerStatus ? { status: ledgerStatus } : {}),
      providerRef: event.providerRef ?? payment.providerRef,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))

  await finish('applied')

  return { status: 'applied', userId: payment.userId, plan }
}
