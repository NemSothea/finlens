/**
 * Payment provider contract.
 *
 * Same reasoning as `MarketDataProvider`: nothing outside `src/lib/payments/`
 * knows which processor is in use. Cambodia-first means ABA PayWay and KHQR
 * today, but a second market means Stripe tomorrow, and the switch must be one
 * file rather than a rewrite of checkout, webhooks and reconciliation.
 */

export type PlanId = 'pro_monthly' | 'pro_annual'

export interface PlanPrice {
  plan: PlanId
  amount: number
  currency: string
  label: string
  /** Days of access a successful payment grants. */
  periodDays: number
}

/** Single source of truth for what things cost. */
export const PLAN_PRICES: Record<PlanId, PlanPrice> = {
  pro_monthly: {
    plan: 'pro_monthly',
    amount: 5,
    currency: 'USD',
    label: 'Pro — monthly',
    periodDays: 30,
  },
  pro_annual: {
    plan: 'pro_annual',
    amount: 50,
    currency: 'USD',
    label: 'Pro — annual',
    periodDays: 365,
  },
}

export interface CheckoutRequest {
  reference: string
  plan: PlanId
  amount: number
  currency: string
  userId: string
  email: string | null
  returnUrl: string
  callbackUrl: string
}

export interface CheckoutSession {
  /** Where to send the browser, or null when the provider needs a form POST. */
  redirectUrl: string | null
  /** Fields to POST to `formAction` when there is no plain redirect. */
  formAction?: string
  formFields?: Record<string, string>
  /** KHQR payload string, when the provider returns one to render as a QR. */
  qrString?: string | null
}

export type PaymentEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'unknown'

/** A provider callback, normalised. Everything downstream speaks this shape. */
export interface NormalisedEvent {
  /** Idempotency key — the provider's own id for this event. */
  eventId: string
  type: PaymentEventType
  /** Our reference, echoed back by the provider. */
  reference: string | null
  providerRef: string | null
  amount: number | null
  currency: string | null
  raw: unknown
}

export type VerifyResult =
  | { ok: true; event: NormalisedEvent }
  | { ok: false; reason: 'bad-signature' | 'malformed' | 'not-configured' }

export interface PaymentProvider {
  readonly name: string

  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>

  /**
   * Verify AND normalise an inbound webhook.
   *
   * Verification is not optional and not separable: an unverified callback is
   * an attacker telling us they paid. Returning the event and the signature
   * check from one function means no caller can accidentally use one without
   * the other.
   */
  verifyWebhook(rawBody: string, headers: Headers): VerifyResult
}

export class PaymentConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentConfigError'
  }
}
