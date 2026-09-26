/**
 * Subscription state → what the user may actually do.
 *
 * Pure functions over a subscription row. Kept separate from the DB and the UI
 * so the rules can be unit-tested exhaustively: a paywall that is only correct
 * in the happy path either leaks the product or locks out paying customers, and
 * both are expensive.
 *
 * The rule everything else follows: **entitlement is resolved server-side and
 * enforced at every surface** — pages, server actions, and JSON API alike.
 * Hiding a button is presentation, not enforcement.
 */

export type Plan = 'free' | 'pro_monthly' | 'pro_annual'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export interface SubscriptionRecord {
  plan: string
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export interface Entitlement {
  plan: Plan
  isPro: boolean
  status: SubscriptionStatus | 'none'
  /** Access continues until this instant even after cancellation. */
  accessUntil: Date | null
  /** Paid but the last charge failed — still served, with a warning. */
  inGracePeriod: boolean
  /** Cancelled but the paid period has not run out yet. */
  endingSoon: boolean
  limits: Limits
}

export interface Limits {
  /** Max watchlist entries. `Infinity` for unlimited. */
  watchlistSize: number
  /** Fiscal years of financial history returned. */
  financialYears: number
  /** Max symbols in a single comparison. */
  compareSymbols: number
  /** Interactive DCF with editable assumptions. */
  interactiveValuation: boolean
  /** Portfolio tracking at all. */
  portfolio: boolean
  /** Days of price history. */
  priceHistoryDays: number
}

export const FREE_LIMITS: Limits = {
  watchlistSize: 3,
  financialYears: 5,
  compareSymbols: 2,
  interactiveValuation: false,
  portfolio: false,
  priceHistoryDays: 365,
}

export const PRO_LIMITS: Limits = {
  watchlistSize: Infinity,
  financialYears: 30,
  compareSymbols: 4,
  interactiveValuation: true,
  portfolio: true,
  priceHistoryDays: 365 * 30,
}

export const ANONYMOUS_ENTITLEMENT: Entitlement = {
  plan: 'free',
  isPro: false,
  status: 'none',
  accessUntil: null,
  inGracePeriod: false,
  endingSoon: false,
  limits: FREE_LIMITS,
}

/**
 * How long a failed payment keeps working before access is cut.
 *
 * Non-zero on purpose: an expired card must not lock a paying customer out of
 * their own portfolio the same hour it fails. Dunning happens in this window.
 */
export const GRACE_PERIOD_DAYS = 7

const PRO_PLANS = new Set<Plan>(['pro_monthly', 'pro_annual'])

function normalisePlan(plan: string): Plan {
  return PRO_PLANS.has(plan as Plan) ? (plan as Plan) : 'free'
}

function normaliseStatus(status: string): SubscriptionStatus | 'none' {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'canceled':
      return status
    default:
      // An unrecognised status must not grant access. Fail closed — a typo or
      // a new provider state should downgrade, never upgrade.
      return 'none'
  }
}

export function resolveEntitlement(
  subscription: SubscriptionRecord | null,
  now: Date = new Date(),
): Entitlement {
  if (!subscription) return ANONYMOUS_ENTITLEMENT

  const plan = normalisePlan(subscription.plan)
  const status = normaliseStatus(subscription.status)
  const periodEnd = subscription.currentPeriodEnd

  if (plan === 'free' || status === 'none') return ANONYMOUS_ENTITLEMENT

  // Cancelled: keep access until the period they already paid for runs out.
  // Cutting it at the cancel click would be taking money for nothing.
  if (status === 'canceled') {
    const stillPaid = periodEnd != null && periodEnd.getTime() > now.getTime()
    return stillPaid
      ? {
          plan,
          isPro: true,
          status,
          accessUntil: periodEnd,
          inGracePeriod: false,
          endingSoon: true,
          limits: PRO_LIMITS,
        }
      : { ...ANONYMOUS_ENTITLEMENT, status }
  }

  if (status === 'past_due') {
    const graceEnds =
      periodEnd == null
        ? null
        : new Date(periodEnd.getTime() + GRACE_PERIOD_DAYS * 86_400_000)

    // No period end on a past_due row means we cannot tell how long the grace
    // window should be. Deny rather than grant indefinite free access.
    const withinGrace = graceEnds != null && graceEnds.getTime() > now.getTime()

    return withinGrace
      ? {
          plan,
          isPro: true,
          status,
          accessUntil: graceEnds,
          inGracePeriod: true,
          endingSoon: false,
          limits: PRO_LIMITS,
        }
      : { ...ANONYMOUS_ENTITLEMENT, status }
  }

  // active / trialing
  const expired = periodEnd != null && periodEnd.getTime() <= now.getTime()
  if (expired) {
    // An 'active' row whose period has already ended means a webhook was
    // missed. Trust the clock over the flag.
    return { ...ANONYMOUS_ENTITLEMENT, status }
  }

  return {
    plan,
    isPro: true,
    status,
    accessUntil: periodEnd,
    inGracePeriod: false,
    endingSoon: subscription.cancelAtPeriodEnd,
    limits: PRO_LIMITS,
  }
}

/**
 * Lives here, not in the Server Action module: a `'use server'` file may only
 * export async functions, and a single non-function export makes Turbopack
 * reject every export in that file.
 */
export const UPGRADE_MESSAGE = 'Portfolio tracking is a Pro feature. Upgrade to record trades.'

/** Routes that require an active subscription. Checked in middleware AND at
 *  each handler — middleware alone is a single point of bypass. */
export const PRO_ROUTES = ['/portfolio'] as const

export function isProRoute(pathname: string): boolean {
  return PRO_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export interface LimitCheck {
  allowed: boolean
  limit: number
  current: number
  message?: string
}

export function checkWatchlistLimit(entitlement: Entitlement, current: number): LimitCheck {
  const limit = entitlement.limits.watchlistSize
  const allowed = current < limit

  return {
    allowed,
    limit,
    current,
    message: allowed
      ? undefined
      : `The free plan holds ${limit} companies. Upgrade for an unlimited watchlist.`,
  }
}
