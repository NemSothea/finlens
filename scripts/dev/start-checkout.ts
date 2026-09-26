/**
 * Local development helper — create a pending payment for a user.
 *
 *   npm run dev:checkout -- --email=you@example.com --plan=pro_monthly
 *
 * Runs the same provider `createCheckout` and writes the same `payments` doc
 * that `startCheckout` does, minus the session lookup — so the webhook can be
 * exercised end to end from a terminal.
 */
import '@/lib/env'
import { randomUUID } from 'node:crypto'
import { adminAuth, db } from '@/db'
import { refs, type PaymentDoc } from '@/db/schema'
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

  const user = await adminAuth
    .getUserByEmail(email)
    .then((u) => ({ id: u.uid, email: u.email ?? null }))
    .catch(() => null)

  if (!user) {
    console.error(`No user with email ${email}.`)
    process.exit(1)
  }

  const providerName = getActiveProviderName()
  const provider = getPaymentProvider(providerName)
  const reference = `fl_${randomUUID().replace(/-/g, '')}`

  const payment: PaymentDoc = {
    userId: user.id,
    provider: providerName,
    reference,
    providerRef: null,
    plan,
    amount: price.amount,
    currency: price.currency,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await refs.payment(providerName, reference).create(payment)

  const baseUrl = process.env.APP_URL ?? 'http://localhost:3001'

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

  await db.terminate()
}

main().catch(async (error) => {
  console.error(error)
  await db.terminate().catch(() => {})
  process.exit(1)
})
