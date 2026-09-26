import { db, toDate } from '@/db'
import {
  refs,
  type PaymentDoc,
  type PaymentEventDoc,
  type SubscriptionDoc,
} from '@/db/schema'
import { PLAN_PRICES, type NormalisedEvent, type PlanId } from './types'
import { amountMatches, applyPaymentEvent, nextPaymentStatus } from './transitions'

/**
 * Webhook processing.
 *
 * Providers retry aggressively, deliver out of order, and occasionally send the
 * same event several times. The rules that make that survivable:
 *
 * 1. **The ledger doc is the lock.** Every event is recorded in
 *    `paymentEvents` under an id derived from `(provider, event_id)`. A
 *    duplicate finds the doc already there, and the handler stops — the
 *    subscription is never extended twice.
 * 2. **The amount is checked against our own price**, not trusted from the
 *    callback. Otherwise a $0.01 payment buys a month.
 * 3. **The plan comes from our `payments` doc**, not the callback. The caller
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
  // access they paid for. Firestore retries the whole function on contention,
  // and two concurrent deliveries of the same event cannot both see the ledger
  // doc as missing and both commit.
  return db.runTransaction(async (tx) => {
    const eventRef = refs.paymentEvent(providerName, event.eventId)
    const paymentRef = event.reference ? refs.payment(providerName, event.reference) : null

    // ── Reads. Firestore requires every read before the first write. ──
    const eventSnap = await tx.get(eventRef)
    if (eventSnap.exists) return { status: 'duplicate' } as const

    const paymentSnap = paymentRef ? await tx.get(paymentRef) : null
    const payment = paymentSnap?.exists ? (paymentSnap.data() as PaymentDoc) : null

    const subscriptionRef = payment ? refs.subscription(payment.userId) : null
    const subscriptionSnap = subscriptionRef ? await tx.get(subscriptionRef) : null
    const currentRow = subscriptionSnap?.exists ? (subscriptionSnap.data() as SubscriptionDoc) : null

    // ── Decide, then write. ───────────────────────────────────────────
    const ledger = (result: string, error?: string): PaymentEventDoc => ({
      provider: providerName,
      eventId: event.eventId,
      type: event.type,
      reference: event.reference ?? null,
      // Stored as JSON text: provider payloads can hold shapes Firestore
      // refuses (nested arrays), and the ledger is for reading, not querying.
      payload: JSON.stringify(event.raw ?? null),
      receivedAt: now,
      processedAt: new Date(),
      result,
      error: error ?? null,
    })

    // 1. The purchase this event belongs to.
    if (!event.reference || !paymentRef) {
      tx.create(eventRef, ledger('ignored', 'event carried no reference'))
      return { status: 'ignored', reason: 'no reference' } as const
    }

    if (!payment) {
      // A callback for a purchase we never created. Recorded for investigation
      // rather than acted on — this is either a bug or a forged reference.
      tx.create(eventRef, ledger('ignored', `no payment for reference ${event.reference}`))
      return { status: 'ignored', reason: 'unknown reference' } as const
    }

    const plan = payment.plan as PlanId
    const price = PLAN_PRICES[plan]

    if (!price) {
      tx.create(eventRef, ledger('error', `payment carries unknown plan ${payment.plan}`))
      return { status: 'ignored', reason: 'unknown plan' } as const
    }

    // 2. Verify the money. Underpayment must never grant access, so a success
    // event whose amount does not match our price is downgraded to a failure.
    if (event.type === 'payment.succeeded' && !amountMatches(price.amount, event.amount)) {
      // Only a purchase still awaiting settlement is marked failed. A payment
      // that already cleared stays `paid` — a late underpaid callback must not
      // rewrite the receipt for money that did arrive.
      const ledgerStatus = nextPaymentStatus(payment.status, 'failed')
      if (ledgerStatus) tx.update(paymentRef, { status: ledgerStatus, updatedAt: new Date() })

      tx.create(
        eventRef,
        ledger('ignored', `amount mismatch: expected ${price.amount}, got ${event.amount}`),
      )
      return { status: 'ignored', reason: 'amount mismatch' } as const
    }

    // 3. Apply the transition.
    const outcome = applyPaymentEvent({
      event,
      plan,
      provider: providerName,
      current: currentRow
        ? {
            plan: currentRow.plan,
            status: currentRow.status,
            provider: currentRow.provider,
            providerRef: currentRow.providerRef,
            currentPeriodEnd: toDate(currentRow.currentPeriodEnd),
            cancelAtPeriodEnd: currentRow.cancelAtPeriodEnd ?? false,
          }
        : null,
      now,
    })

    if (outcome.action === 'ignore') {
      tx.create(eventRef, ledger('ignored', outcome.reason))
      return { status: 'ignored', reason: outcome.reason } as const
    }

    const { next, paymentStatus } = outcome

    const subscription: SubscriptionDoc = {
      plan: next.plan,
      status: next.status,
      provider: next.provider,
      providerRef: next.providerRef,
      currentPeriodEnd: next.currentPeriodEnd,
      cancelAtPeriodEnd: next.cancelAtPeriodEnd,
      updatedAt: new Date(),
    }
    tx.set(subscriptionRef!, subscription)

    // The subscription has already moved; the payment only follows when the
    // move is a legal one. A failed renewal leaves the original `paid` receipt
    // intact while the subscription still goes `past_due`.
    const ledgerStatus = nextPaymentStatus(payment.status, paymentStatus)
    tx.update(paymentRef, {
      ...(ledgerStatus ? { status: ledgerStatus } : {}),
      providerRef: event.providerRef ?? payment.providerRef ?? null,
      updatedAt: new Date(),
    })

    tx.create(eventRef, ledger('applied'))

    return { status: 'applied', userId: payment.userId, plan } as const
  })
}
