import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  amountMatches,
  applyPaymentEvent,
  extendPeriod,
  nextPaymentStatus,
  type SubscriptionState,
} from './transitions'
import { resolveEntitlement } from '@/lib/billing/entitlements'
import type { NormalisedEvent, PaymentEventType } from './types'

const NOW = new Date('2026-06-15T12:00:00Z')
const DAY = 86_400_000

function at(days: number): Date {
  return new Date(NOW.getTime() + days * DAY)
}

function event(type: PaymentEventType, over: Partial<NormalisedEvent> = {}): NormalisedEvent {
  return {
    eventId: 'evt_1',
    type,
    reference: 'ref_1',
    providerRef: 'txn_1',
    amount: 5,
    currency: 'USD',
    raw: {},
    ...over,
  }
}

function current(over: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    plan: 'pro_monthly',
    status: 'active',
    provider: 'payway',
    providerRef: 'txn_0',
    currentPeriodEnd: at(10),
    cancelAtPeriodEnd: false,
    ...over,
  }
}

describe('extendPeriod', () => {
  test('adds to remaining time when renewing early', () => {
    // Renewing with 10 days left must give 40, not 30 — otherwise the customer
    // silently loses the time they already paid for.
    assert.equal(extendPeriod(at(10), NOW, 30).getTime(), at(40).getTime())
  })

  test('starts from now when the period already lapsed', () => {
    // Extending a stale end date would put part of the new period in the past.
    assert.equal(extendPeriod(at(-20), NOW, 30).getTime(), at(30).getTime())
  })

  test('starts from now for a first payment', () => {
    assert.equal(extendPeriod(null, NOW, 30).getTime(), at(30).getTime())
  })

  test('handles the annual period', () => {
    assert.equal(extendPeriod(null, NOW, 365).getTime(), at(365).getTime())
  })
})

describe('applyPaymentEvent — success', () => {
  test('a first payment activates the subscription', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: null,
      now: NOW,
    })

    assert.equal(out.action, 'update')
    if (out.action !== 'update') return

    assert.equal(out.next.status, 'active')
    assert.equal(out.next.plan, 'pro_monthly')
    assert.equal(out.next.currentPeriodEnd?.getTime(), at(30).getTime())
    assert.equal(out.paymentStatus, 'paid')
  })

  test('a renewal stacks on top of remaining time', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ currentPeriodEnd: at(10) }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.currentPeriodEnd?.getTime(), at(40).getTime())
  })

  test('paying revokes a pending cancellation', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ cancelAtPeriodEnd: true }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.cancelAtPeriodEnd, false)
  })

  test('recovers a past_due subscription', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ status: 'past_due', currentPeriodEnd: at(-3) }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.status, 'active')
    // Lapsed, so the new period starts today rather than from the stale date.
    assert.equal(out.next.currentPeriodEnd?.getTime(), at(30).getTime())
  })

  test('upgrading to annual switches the plan and its period', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded', { amount: 50 }),
      plan: 'pro_annual',
      provider: 'payway',
      current: current(),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.plan, 'pro_annual')
    assert.equal(out.next.currentPeriodEnd?.getTime(), at(375).getTime())
  })

  test('records the provider transaction id for reconciliation', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded', { providerRef: 'txn_abc' }),
      plan: 'pro_monthly',
      provider: 'payway',
      current: null,
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.providerRef, 'txn_abc')
  })
})

describe('applyPaymentEvent — failure', () => {
  test('marks an existing subscription past_due', () => {
    const out = applyPaymentEvent({
      event: event('payment.failed'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current(),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.status, 'past_due')
    assert.equal(out.paymentStatus, 'failed')
  })

  test('leaves the period end untouched so grace stays measurable', () => {
    // entitlements.ts measures the 7-day grace window from currentPeriodEnd;
    // moving it here would silently extend or destroy that window.
    const out = applyPaymentEvent({
      event: event('payment.failed'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ currentPeriodEnd: at(2) }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.currentPeriodEnd?.getTime(), at(2).getTime())
  })

  test('ignores a failure for a user who never subscribed', () => {
    const out = applyPaymentEvent({
      event: event('payment.failed'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: null,
      now: NOW,
    })

    assert.equal(out.action, 'ignore')
  })
})

describe('applyPaymentEvent — refund', () => {
  test('ends access immediately', () => {
    // The money went back, so the period they paid for no longer exists.
    const out = applyPaymentEvent({
      event: event('payment.refunded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ currentPeriodEnd: at(20) }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(out.next.status, 'canceled')
    assert.equal(out.next.currentPeriodEnd?.getTime(), NOW.getTime())
  })

  test('a refunded subscription resolves to no access', () => {
    // The end-to-end claim: the transition must actually revoke entitlement.
    const out = applyPaymentEvent({
      event: event('payment.refunded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ currentPeriodEnd: at(20) }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    assert.equal(resolveEntitlement(out.next, NOW).isPro, false)
  })

  test('ignores a refund with no subscription', () => {
    const out = applyPaymentEvent({
      event: event('payment.refunded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: null,
      now: NOW,
    })

    assert.equal(out.action, 'ignore')
  })
})

describe('applyPaymentEvent — unknown types', () => {
  test('ignores rather than guessing', () => {
    const out = applyPaymentEvent({
      event: event('unknown'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current(),
      now: NOW,
    })

    assert.equal(out.action, 'ignore')
  })
})

describe('applyPaymentEvent — entitlement round trip', () => {
  test('a successful payment produces a state that resolves to Pro', () => {
    const out = applyPaymentEvent({
      event: event('payment.succeeded'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: null,
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    const entitlement = resolveEntitlement(out.next, NOW)

    assert.equal(entitlement.isPro, true)
    assert.equal(entitlement.limits.portfolio, true)
  })

  test('a failed payment still serves inside the grace window', () => {
    const out = applyPaymentEvent({
      event: event('payment.failed'),
      plan: 'pro_monthly',
      provider: 'payway',
      current: current({ currentPeriodEnd: at(-2) }),
      now: NOW,
    })

    if (out.action !== 'update') throw new Error('expected update')
    const entitlement = resolveEntitlement(out.next, NOW)

    assert.equal(entitlement.isPro, true)
    assert.equal(entitlement.inGracePeriod, true)
  })
})

describe('amountMatches', () => {
  test('accepts the exact amount', () => {
    assert.equal(amountMatches(5, 5), true)
  })

  test('tolerates float representation noise', () => {
    assert.equal(amountMatches(5, 4.999999999999999), true)
  })

  test('rejects an underpayment', () => {
    // Without this, a $0.01 payment would buy a month.
    assert.equal(amountMatches(5, 0.01), false)
  })

  test('rejects a missing amount', () => {
    assert.equal(amountMatches(5, null), false)
  })
})

describe('nextPaymentStatus', () => {
  test('settles a pending purchase', () => {
    assert.equal(nextPaymentStatus('pending', 'paid'), 'paid')
    assert.equal(nextPaymentStatus('pending', 'failed'), 'failed')
    assert.equal(nextPaymentStatus('pending', 'refunded'), 'refunded')
  })

  test('never rewrites a paid receipt as failed', () => {
    // The case that matters: a late underpaid or declined callback arrives on a
    // reference that already settled. The subscription may go past_due, but the
    // ledger must keep saying the money arrived.
    assert.equal(nextPaymentStatus('paid', 'failed'), null)
  })

  test('lets a refund follow a payment', () => {
    assert.equal(nextPaymentStatus('paid', 'refunded'), 'refunded')
  })

  test('lets a retry of a failed reference settle', () => {
    assert.equal(nextPaymentStatus('failed', 'paid'), 'paid')
  })

  test('treats refunded as terminal', () => {
    assert.equal(nextPaymentStatus('refunded', 'paid'), null)
    assert.equal(nextPaymentStatus('refunded', 'failed'), null)
  })

  test('is a no-op when nothing changes', () => {
    assert.equal(nextPaymentStatus('paid', 'paid'), null)
  })

  test('leaves an unrecognised status alone', () => {
    // Fail closed: a status this code does not understand is not something to
    // overwrite on a guess.
    assert.equal(nextPaymentStatus('chargeback_pending', 'paid'), null)
  })
})
