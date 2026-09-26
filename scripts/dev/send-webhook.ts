/**
 * Local development helper — post a signed webhook to the running app.
 *
 *   npm run dev:webhook -- --reference=fl_abc --type=payment.succeeded --amount=5
 *   npm run dev:webhook -- --reference=fl_abc --event-id=evt_1   # replay the same id
 *
 * Signs with PAYMENTS_MANUAL_SECRET, so it exercises the real verification path
 * rather than bypassing it. Used to prove webhook idempotency without a
 * merchant account.
 */
import '@/lib/env'
import { manualSignature } from '@/lib/payments/manual'

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
  const secret = process.env.PAYMENTS_MANUAL_SECRET
  if (!secret) {
    console.error('PAYMENTS_MANUAL_SECRET is not set.')
    process.exit(1)
  }

  const reference = arg('reference')
  const type = arg('type', 'payment.succeeded')
  const amount = Number(arg('amount', '5'))
  const eventId = arg('event-id', `evt_${reference}_${type}`)
  const baseUrl = arg('url', 'http://localhost:3001')
  const badSignature = process.argv.includes('--bad-signature')

  const body = JSON.stringify({
    eventId,
    type,
    reference,
    providerRef: `txn_${reference}`,
    amount,
    currency: 'USD',
  })

  const signature = badSignature ? 'deadbeef'.repeat(8) : manualSignature(body, secret)

  const response = await fetch(`${baseUrl}/api/payments/webhook/manual`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-finlens-signature': signature },
    body,
  })

  console.log(`${response.status} ${await response.text()}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
