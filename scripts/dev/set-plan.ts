/**
 * Local development helper — set a user's subscription state.
 *
 *   npm run dev:pro  -- --email=you@example.com
 *   npm run dev:pro  -- --email=you@example.com --plan=free
 *   npm run dev:pro  -- --email=you@example.com --status=past_due --days=-3
 *
 * Stands in for the checkout flow until payments land (phase 7). It writes the
 * same `subscriptions` row a webhook will, so the entitlement path being tested
 * here is exactly the one production will use.
 */
import '@/lib/env'
import { eq } from 'drizzle-orm'
import { db, sql } from '@/db'
import { subscriptions, users } from '@/db/schema'
import { resolveEntitlement } from '@/lib/billing/entitlements'

function arg(name: string, fallback?: string): string {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  const value = hit?.split('=').slice(1).join('=') ?? fallback
  if (value === undefined) {
    console.error(`Missing --${name}=`)
    process.exit(1)
  }
  return value
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    // Granting paid access must never be a one-liner against production.
    console.error('Refusing to run against a production environment.')
    process.exit(1)
  }

  const email = arg('email').trim().toLowerCase()
  const plan = arg('plan', 'pro_monthly')
  const status = arg('status', 'active')
  const days = Number(arg('days', '30'))

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    console.error(`No user with email ${email}. Create one with npm run dev:user first.`)
    process.exit(1)
  }

  const currentPeriodEnd = new Date(Date.now() + days * 86_400_000)

  await db
    .insert(subscriptions)
    .values({
      userId: user.id,
      plan,
      status,
      provider: 'manual',
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: { plan, status, provider: 'manual', currentPeriodEnd, updatedAt: new Date() },
    })

  const entitlement = resolveEntitlement({
    plan,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
  })

  console.log(`${email}: plan=${plan} status=${status} until=${currentPeriodEnd.toISOString().slice(0, 10)}`)
  console.log(`  resolves to isPro=${entitlement.isPro} grace=${entitlement.inGracePeriod}`)

  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  await sql.end().catch(() => {})
  process.exit(1)
})
