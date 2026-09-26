import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  PaymentConfigError,
  type CheckoutRequest,
  type CheckoutSession,
  type PaymentEventType,
  type PaymentProvider,
  type VerifyResult,
} from './types'

/**
 * Offline payment provider.
 *
 * Same role as `FixtureProvider` for market data: it makes checkout, the
 * webhook and the whole subscription lifecycle testable before anyone has
 * merchant credentials, and keeps CI independent of a third-party sandbox.
 *
 * It is NOT a bypass — callbacks are still HMAC-signed and verified with the
 * same code path as PayWay. A test that skipped verification would prove
 * nothing about the real handler.
 */

export interface ManualOptions {
  secret?: string
}

export function manualSignature(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex')
}

export class ManualProvider implements PaymentProvider {
  readonly name = 'manual'
  private readonly secret: string

  constructor(options: ManualOptions = {}) {
    const secret = options.secret ?? process.env.PAYMENTS_MANUAL_SECRET

    // No default secret. A hard-coded fallback would ship a universally
    // forgeable webhook to anyone who deployed without setting the variable.
    if (!secret) {
      throw new PaymentConfigError(
        'PAYMENTS_MANUAL_SECRET must be set to use the manual payment provider.',
      )
    }

    if (process.env.NODE_ENV === 'production' && process.env.PAYMENTS_ALLOW_MANUAL !== 'true') {
      throw new PaymentConfigError(
        'The manual payment provider is disabled in production. Set PAYMENTS_ALLOW_MANUAL=true only if you really mean it.',
      )
    }

    this.secret = secret
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    // Sends the operator to an internal page that posts a signed callback,
    // exercising exactly the same webhook route a real provider would hit.
    const url = new URL(request.returnUrl)
    url.searchParams.set('manual', request.reference)

    return { redirectUrl: url.toString(), qrString: null }
  }

  verifyWebhook(rawBody: string, headers: Headers): VerifyResult {
    const provided = headers.get('x-finlens-signature')
    if (!provided) return { ok: false, reason: 'malformed' }

    const expected = manualSignature(rawBody, this.secret)

    const expectedBuffer = Buffer.from(expected)
    const providedBuffer = Buffer.from(provided)

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return { ok: false, reason: 'bad-signature' }
    }

    let parsed: {
      eventId?: string
      type?: string
      reference?: string
      providerRef?: string
      amount?: number
      currency?: string
    }

    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return { ok: false, reason: 'malformed' }
    }

    if (!parsed.eventId || !parsed.reference) return { ok: false, reason: 'malformed' }

    const known: PaymentEventType[] = ['payment.succeeded', 'payment.failed', 'payment.refunded']
    const type = known.includes(parsed.type as PaymentEventType)
      ? (parsed.type as PaymentEventType)
      : 'unknown'

    return {
      ok: true,
      event: {
        eventId: parsed.eventId,
        type,
        reference: parsed.reference,
        providerRef: parsed.providerRef ?? parsed.eventId,
        amount: parsed.amount ?? null,
        currency: parsed.currency ?? 'USD',
        raw: parsed,
      },
    }
  }
}
