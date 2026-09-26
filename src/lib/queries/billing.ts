import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscriptions } from '@/db/schema'
import { auth } from '@/auth'
import {
  ANONYMOUS_ENTITLEMENT,
  resolveEntitlement,
  type Entitlement,
} from '@/lib/billing/entitlements'

/**
 * Entitlement resolution.
 *
 * `cache()` dedupes within a single request: a page, its layout and three
 * child components all asking "is this user pro?" produce one query, not four.
 * It does NOT cache across requests — a subscription change must take effect on
 * the next page load, not after a TTL.
 */

export const getEntitlementForUser = cache(async (userId: string): Promise<Entitlement> => {
  const [row] = await db
    .select({
      plan: subscriptions.plan,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  return resolveEntitlement(row ?? null)
})

/**
 * The entitlement for whoever is making the current request.
 *
 * Signed-out visitors get the anonymous (free) entitlement rather than an
 * error — most of the product works without an account, and callers should not
 * each have to handle "no session" separately.
 */
export const getCurrentEntitlement = cache(async (): Promise<Entitlement> => {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return ANONYMOUS_ENTITLEMENT
  return getEntitlementForUser(userId)
})

export const getCurrentUserAndEntitlement = cache(
  async (): Promise<{ userId: string | null; entitlement: Entitlement }> => {
    const session = await auth()
    const userId = session?.user?.id ?? null

    return {
      userId,
      entitlement: userId ? await getEntitlementForUser(userId) : ANONYMOUS_ENTITLEMENT,
    }
  },
)
