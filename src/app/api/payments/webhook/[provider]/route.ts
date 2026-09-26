import type { NextRequest } from 'next/server'
import { getPaymentProvider, isSupportedProvider } from '@/lib/payments/registry'
import { processPaymentEvent } from '@/lib/payments/webhook'
import { PaymentConfigError } from '@/lib/payments/types'

/**
 * POST /api/payments/webhook/payway
 *
 * Rules this handler holds to:
 *
 * - **Read the raw body, never the parsed one.** Signatures cover the exact
 *   bytes sent; re-serialising JSON changes key order and whitespace and breaks
 *   verification.
 * - **Verify before anything else.** An unverified callback is an attacker
 *   claiming they paid.
 * - **Return 200 for duplicates.** A non-2xx makes the provider retry forever
 *   on an event we have already handled.
 * - **Return 200 for events we deliberately ignore.** They are recorded in the
 *   ledger; asking for a retry would not change the outcome.
 * - **Leak nothing.** Responses carry a status word, never the reason a
 *   signature failed or whether a reference exists.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/payments/webhook/[provider]'>,
) {
  const { provider } = await ctx.params

  if (!isSupportedProvider(provider)) {
    return Response.json({ error: 'Unknown provider' }, { status: 404 })
  }

  const rawBody = await request.text()

  let paymentProvider
  try {
    paymentProvider = getPaymentProvider(provider)
  } catch (error) {
    if (error instanceof PaymentConfigError) {
      // Misconfiguration is ours, not the caller's. 503 so the provider retries
      // once we have fixed the deployment instead of dropping the event.
      console.error(`[webhook:${provider}] ${error.message}`)
      return Response.json({ error: 'Provider not configured' }, { status: 503 })
    }
    throw error
  }

  const verified = paymentProvider.verifyWebhook(rawBody, request.headers)

  if (!verified.ok) {
    console.warn(`[webhook:${provider}] rejected: ${verified.reason}`)
    // 400 for every rejection, with no detail — a distinct message per reason
    // would let an attacker tune a forgery against the responses.
    return Response.json({ error: 'Invalid webhook' }, { status: 400 })
  }

  try {
    const result = await processPaymentEvent(provider, verified.event)
    return Response.json(result, { status: 200 })
  } catch (error) {
    // 500 asks the provider to retry, which is the right answer here: the claim
    // and the subscription update share one transaction, so a crash rolls back
    // both and the retry genuinely re-processes instead of being deduped
    // against a half-finished attempt.
    console.error(`[webhook:${provider}] processing failed`, error)
    return Response.json({ error: 'Processing failed' }, { status: 500 })
  }
}
