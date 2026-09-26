import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  ANONYMOUS_ENTITLEMENT,
  FREE_LIMITS,
  GRACE_PERIOD_DAYS,
  PRO_LIMITS,
  checkWatchlistLimit,
  isProRoute,
  resolveEntitlement,
  type SubscriptionRecord,
} from './entitlements'

const NOW = new Date('2026-06-15T12:00:00Z')

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000)
}

function sub(over: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    plan: 'pro_monthly',
    status: 'active',
    currentPeriodEnd: daysFromNow(10),
    cancelAtPeriodEnd: false,
    ...over,
  }
}

describe('resolveEntitlement — no subscription', () => {
  test('a missing row is a free user', () => {
    const e = resolveEntitlement(null, NOW)
    assert.equal(e.isPro, false)
    assert.equal(e.plan, 'free')
    assert.deepEqual(e.limits, FREE_LIMITS)
  })

  test('an explicit free plan is a free user', () => {
    const e = resolveEntitlement(sub({ plan: 'free', status: 'active' }), NOW)
    assert.equal(e.isPro, false)
  })
})

describe('resolveEntitlement — active', () => {
  test('grants pro limits', () => {
    const e = resolveEntitlement(sub(), NOW)
    assert.equal(e.isPro, true)
    assert.deepEqual(e.limits, PRO_LIMITS)
    assert.equal(e.inGracePeriod, false)
    assert.equal(e.endingSoon, false)
  })

  test('trialing is treated as paid', () => {
    assert.equal(resolveEntitlement(sub({ status: 'trialing' }), NOW).isPro, true)
  })

  test('annual plan is pro', () => {
    assert.equal(resolveEntitlement(sub({ plan: 'pro_annual' }), NOW).isPro, true)
  })

  test('cancelAtPeriodEnd still serves, flagged as ending', () => {
    const e = resolveEntitlement(sub({ cancelAtPeriodEnd: true }), NOW)
    assert.equal(e.isPro, true)
    assert.equal(e.endingSoon, true)
  })

  test('an active row whose period already ended is NOT pro', () => {
    // Means a webhook was missed. Trust the clock over the flag, or a lapsed
    // subscription is served forever.
    const e = resolveEntitlement(sub({ currentPeriodEnd: daysFromNow(-1) }), NOW)
    assert.equal(e.isPro, false)
    assert.equal(e.status, 'active')
  })

  test('an active row with no period end is served', () => {
    // Comped and lifetime accounts have no end date.
    assert.equal(resolveEntitlement(sub({ currentPeriodEnd: null }), NOW).isPro, true)
  })
})

describe('resolveEntitlement — canceled', () => {
  test('keeps access until the paid period runs out', () => {
    // Cutting at the cancel click would be taking money for nothing.
    const e = resolveEntitlement(
      sub({ status: 'canceled', currentPeriodEnd: daysFromNow(5) }),
      NOW,
    )

    assert.equal(e.isPro, true)
    assert.equal(e.endingSoon, true)
    assert.equal(e.accessUntil?.getTime(), daysFromNow(5).getTime())
  })

  test('drops to free once the period has passed', () => {
    const e = resolveEntitlement(
      sub({ status: 'canceled', currentPeriodEnd: daysFromNow(-1) }),
      NOW,
    )
    assert.equal(e.isPro, false)
  })

  test('drops to free when there is no period end at all', () => {
    const e = resolveEntitlement(sub({ status: 'canceled', currentPeriodEnd: null }), NOW)
    assert.equal(e.isPro, false)
  })

  test('is exclusive at the exact boundary', () => {
    const e = resolveEntitlement(sub({ status: 'canceled', currentPeriodEnd: NOW }), NOW)
    assert.equal(e.isPro, false)
  })
})

describe('resolveEntitlement — past_due grace period', () => {
  test('serves inside the grace window and flags it', () => {
    // A failed card must not lock a paying customer out the same hour.
    const e = resolveEntitlement(
      sub({ status: 'past_due', currentPeriodEnd: daysFromNow(-1) }),
      NOW,
    )

    assert.equal(e.isPro, true)
    assert.equal(e.inGracePeriod, true)
  })

  test('cuts access once the grace window expires', () => {
    const e = resolveEntitlement(
      sub({ status: 'past_due', currentPeriodEnd: daysFromNow(-GRACE_PERIOD_DAYS - 1) }),
      NOW,
    )

    assert.equal(e.isPro, false)
    assert.equal(e.inGracePeriod, false)
  })

  test('denies when there is no period end to measure grace from', () => {
    // Otherwise a past_due row with a null date is free pro access forever.
    const e = resolveEntitlement(sub({ status: 'past_due', currentPeriodEnd: null }), NOW)
    assert.equal(e.isPro, false)
  })
})

describe('resolveEntitlement — fails closed', () => {
  test('an unknown status never grants access', () => {
    for (const status of ['', 'paused', 'incomplete', 'ACTIVE', 'refunded']) {
      const e = resolveEntitlement(sub({ status }), NOW)
      assert.equal(e.isPro, false, `status "${status}" must not grant pro`)
    }
  })

  test('an unknown plan never grants access', () => {
    for (const plan of ['', 'enterprise', 'PRO_MONTHLY', 'pro']) {
      const e = resolveEntitlement(sub({ plan }), NOW)
      assert.equal(e.isPro, false, `plan "${plan}" must not grant pro`)
    }
  })

  test('free limits are strictly smaller than pro limits', () => {
    assert.ok(FREE_LIMITS.watchlistSize < PRO_LIMITS.watchlistSize)
    assert.ok(FREE_LIMITS.financialYears < PRO_LIMITS.financialYears)
    assert.ok(FREE_LIMITS.compareSymbols < PRO_LIMITS.compareSymbols)
    assert.ok(FREE_LIMITS.priceHistoryDays < PRO_LIMITS.priceHistoryDays)
    assert.equal(FREE_LIMITS.interactiveValuation, false)
    assert.equal(FREE_LIMITS.portfolio, false)
  })

  test('the anonymous entitlement is never pro', () => {
    assert.equal(ANONYMOUS_ENTITLEMENT.isPro, false)
    assert.equal(ANONYMOUS_ENTITLEMENT.limits.portfolio, false)
  })
})

describe('isProRoute', () => {
  test('matches gated routes and their children', () => {
    assert.equal(isProRoute('/portfolio'), true)
    assert.equal(isProRoute('/portfolio/2'), true)
  })

  test('does not match free routes', () => {
    for (const path of ['/', '/watchlist', '/signin', '/stocks/AAPL', '/compare', '/pricing']) {
      assert.equal(isProRoute(path), false, `${path} must stay free`)
    }
  })

  test('does not match a route that merely starts with the same characters', () => {
    assert.equal(isProRoute('/portfolios-public'), false)
  })
})

describe('checkWatchlistLimit', () => {
  const free = resolveEntitlement(null, NOW)
  const pro = resolveEntitlement(sub(), NOW)

  test('allows a free user below the limit', () => {
    assert.equal(checkWatchlistLimit(free, FREE_LIMITS.watchlistSize - 1).allowed, true)
  })

  test('blocks a free user at the limit', () => {
    const check = checkWatchlistLimit(free, FREE_LIMITS.watchlistSize)
    assert.equal(check.allowed, false)
    assert.ok(check.message?.includes('Upgrade'))
  })

  test('never blocks a pro user', () => {
    assert.equal(checkWatchlistLimit(pro, 10_000).allowed, true)
  })
})
