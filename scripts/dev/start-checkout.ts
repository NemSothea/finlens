/**
 * Local development helper — create a pending payment for a user.
 *
 *   npm run dev:checkout -- --email=you@example.com --plan=pro_monthly
 *
 * Runs the same provider `createCheckout` and writes the same `payments` row
 * that `startCheckout` does, minus the session lookup — so the webhook can be
 * exercised end to end from a terminal.
 */
import '@/lib/env'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db, sql } from '@/db'
import { payments, users } from '@/db/schema'
import { getActiveProviderName, getPaymentProvider } from '@/lib/payments/registry'
import { PLAN_PRICES, type PlanId } from '@/lib/payments/types'

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
    console.error('Refusing to run against a production environment.')
    process.exit(1)
  }

  const email = arg('email').trim().toLowerCase()
  const plan = arg('plan', 'pro_monthly') as PlanId
  const price = PLAN_PRICES[plan]

  if (!price) {
    console.error(`Unknown plan ${plan}. Use pro_monthly or pro_annual.`)
    process.exit(1)
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    console.error(`No user with email ${email}.`)
    process.exit(1)
  }

  const providerName = getActiveProviderName()
  const provider = getPaymentProvider(providerName)
  const reference = `fl_${randomUUID().replace(/-/g, '')}`

  await db.insert(payments).values({
    userId: user.id,
    provider: providerName,
    reference,
    plan,
    amount: String(price.amount),
    currency: price.currency,
    status: 'pending',
  })

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3001'

  const checkout = await provider.createCheckout({
    reference,
    plan,
    amount: price.amount,
    currency: price.currency,
    userId: user.id,
    email: user.email,
    returnUrl: `${baseUrl}/pricing?checkout=${reference}`,
    callbackUrl: `${baseUrl}/api/payments/webhook/${providerName}`,
  })

  console.log(`reference=${reference}`)
  console.log(`provider=${providerName} plan=${plan} amount=${price.amount}`)
  console.log(`handoff=${checkout.redirectUrl ?? checkout.formAction}`)

  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  await sql.end().catch(() => {})
  process.exit(1)
})
