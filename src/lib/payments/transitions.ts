import { PLAN_PRICES, type PlanId, type NormalisedEvent } from './types'

/**
 * Payment event + current subscription → next subscription state.
 *
 * Pure. No DB, no clock of its own (the caller passes `now`), so every branch
 * is unit-testable. Billing bugs are the expensive kind: one wrong branch here
 * either gives away the product or cuts off a paying customer, and neither
 * shows up in a happy-path test.
 */

export interface SubscriptionState {
  plan: string
  status: string
  provider: string | null
  providerRef: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export type TransitionOutcome =
  | { action: 'update'; next: SubscriptionState; paymentStatus: 'paid' | 'failed' | 'refunded' }
  | { action: 'ignore'; reason: string }

export interface TransitionInput {
  event: NormalisedEvent
  plan: PlanId
  provider: string
  /** Null when the user has never had a subscription. */
  current: SubscriptionState | null
  now: Date
}

/**
 * Extend from whichever is later: the existing period end, or now.
 *
 * Renewing early must ADD to remaining time rather than restart from today —
 * otherwise a customer who renews with ten days left silently loses them.
 * Renewing after a lapse starts from today, not from the stale end date, or the
 * new period would be partly in the past.
 */
export function extendPeriod(
  currentEnd: Date | null,
  now: Date,
  periodDays: number,
): Date {
  const base = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now
  return new Date(base.getTime() + periodDays * 86_400_000)
}

export function applyPaymentEvent(input: TransitionInput): TransitionOutcome {
  const { event, plan, provider, current, now } = input

  switch (event.type) {
    case 'payment.succeeded': {
      const price = PLAN_PRICES[plan]

      return {
        action: 'update',
        paymentStatus: 'paid',
        next: {
          plan,
          status: 'active',
          provider,
          providerRef: event.providerRef,
          currentPeriodEnd: extendPeriod(current?.currentPeriodEnd ?? null, now, price.periodDays),
          // A successful payment revokes a pending cancellation — paying again
          // is the clearest possible statement that they want to keep it.
          cancelAtPeriodEnd: false,
        },
      }
    }

    case 'payment.failed': {
      // Nothing to mark past_due against. A failed first payment leaves the
      // user on free, which is where they already were.
      if (!current) return { action: 'ignore', reason: 'no subscription to mark past due' }

      return {
        action: 'update',
        paymentStatus: 'failed',
        next: {
          ...current,
          status: 'past_due',
          provider,
          // currentPeriodEnd is deliberately unchanged: the grace window in
          // `entitlements.ts` is measured from it, so moving it here would
          // silently extend or destroy the grace period.
        },
      }
    }

    case 'payment.refunded': {
      if (!current) return { action: 'ignore', reason: 'no subscription to refund' }

      return {
        action: 'update',
        paymentStatus: 'refunded',
        next: {
          ...current,
          status: 'canceled',
          provider,
          // Access ends immediately — the money went back, so the period they
          // paid for no longer exists.
          currentPeriodEnd: now,
          cancelAtPeriodEnd: true,
        },
      }
    }

    default:
      // Unknown event types are recorded and ignored, never guessed at.
      return { action: 'ignore', reason: `unhandled event type: ${event.type}` }
  }
}

/** Providers send amounts in assorted shapes; compare in cents to dodge float
 *  noise like 4.999999999999999 !== 5. */
export function amountMatches(expected: number, actual: number | null): boolean {
  if (actual == null) return false
  return Math.round(expected * 100) === Math.round(actual * 100)
}

export type PaymentRowStatus = 'pending' | 'paid' | 'failed' | 'refunded'

/**
 * Guard the `payments` ledger against being rewritten backwards.
 *
 * Providers send late, duplicated and out-of-order callbacks, and a renewal
 * arrives against the same reference as the original purchase. Without a guard,
 * an underpaid or failed callback that lands after settlement flips a row that
 * genuinely cleared to `failed`, and the ledger then contradicts the money that
 * actually moved — which is the one record reconciliation has to trust.
 *
 * Allowed moves only:
 *   pending → paid | failed | refunded
 *   paid    → refunded          (the money really did go back)
 *   failed  → paid              (retry of the same reference succeeded)
 *
 * Everything else returns null, meaning "leave the row alone". The subscription
 * transition is decided separately in `applyPaymentEvent` — a failed renewal
 * still moves the subscription to `past_due`; it just stops rewriting the
 * receipt for a purchase that was paid.
 */
export function nextPaymentStatus(
  current: string,
  incoming: PaymentRowStatus,
): PaymentRowStatus | null {
  if (current === incoming) return null

  switch (current) {
    case 'pending':
      return incoming
    case 'paid':
      return incoming === 'refunded' ? 'refunded' : null
    case 'failed':
      return incoming === 'paid' ? 'paid' : null
    case 'refunded':
      // Terminal. The money is back with the customer; nothing reopens that.
      return null
    default:
      // An unrecognised status is not something to overwrite blindly.
      return null
  }
}
