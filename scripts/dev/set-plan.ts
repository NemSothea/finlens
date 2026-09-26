/**
 * Local development helper — set a user's subscription state.
 *
 *   npm run dev:pro  -- --email=you@example.com
 *   npm run dev:pro  -- --email=you@example.com --plan=free
 *   npm run dev:pro  -- --email=you@example.com --status=past_due --days=-3
 *
 * Stands in for the checkout flow until payments land (phase 7). It writes the
 * same `subscriptions/{uid}` doc a webhook will, so the entitlement path being tested
 * here is exactly the one production will use.
 */
import '@/lib/env'
import { adminAuth, db } from '@/db'
import { refs, type SubscriptionDoc } from '@/db/schema'
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

  const user = await adminAuth
    .getUserByEmail(email)
    .then((u) => ({ id: u.uid }))
    .catch(() => null)

  if (!user) {
    console.error(`No user with email ${email}. Create one with npm run dev:user first.`)
    process.exit(1)
  }

  const currentPeriodEnd = new Date(Date.now() + days * 86_400_000)

  const doc: SubscriptionDoc = {
    plan,
    status,
    provider: 'manual',
    providerRef: null,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    updatedAt: new Date(),
  }
  await refs.subscription(user.id).set(doc)

  const entitlement = resolveEntitlement({
    plan,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
  })

  console.log(`${email}: plan=${plan} status=${status} until=${currentPeriodEnd.toISOString().slice(0, 10)}`)
  console.log(`  resolves to isPro=${entitlement.isPro} grace=${entitlement.inGracePeriod}`)

  await db.terminate()
}

main().catch(async (error) => {
  console.error(error)
  await db.terminate().catch(() => {})
  process.exit(1)
})
