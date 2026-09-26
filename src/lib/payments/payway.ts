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
 * ABA PayWay (Cambodia) — card payments and KHQR.
 *
 * Chosen over Stripe because Stripe does not serve Cambodian merchants, and
 * KHQR is how the target market actually pays. That constraint is the reason
 * the provider interface exists at all.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * VERIFY BEFORE GOING LIVE
 *
 * PayWay signs requests with base64(HMAC-SHA512(concatenated-fields, api_key)).
 * The HMAC construction below is standard and tested. What cannot be confirmed
 * from here is the exact FIELD ORDER of the concatenation, which is specific to
 * the integration-guide version issued with your merchant account, and PayWay
 * rejects a hash built in the wrong order.
 *
 * `PURCHASE_HASH_FIELDS` and `CALLBACK_HASH_FIELDS` below are the only things
 * that need checking against your current guide — everything else is order
 * independent. Run `npm run dev:payway-hash` against a sample from the guide to
 * confirm before taking real money.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Order matters. Verify against your PayWay integration guide. */
export const PURCHASE_HASH_FIELDS = [
  'req_time',
  'merchant_id',
  'tran_id',
  'amount',
  'items',
  'shipping',
  'firstname',
  'lastname',
  'email',
  'phone',
  'type',
  'payment_option',
  'return_url',
  'cancel_url',
  'continue_success_url',
  'return_deeplink',
  'currency',
  'custom_fields',
  'return_params',
] as const

/** Order matters. Verify against your PayWay integration guide. */
export const CALLBACK_HASH_FIELDS = ['tran_id', 'apv', 'status'] as const

export interface PaywayOptions {
  merchantId?: string
  apiKey?: string
  baseUrl?: string
}

/**
 * base64(HMAC-SHA512(payload, key)).
 *
 * Exported so the hash can be checked against a known-good sample from the
 * integration guide without standing up the whole provider.
 */
export function paywayHash(payload: string, apiKey: string): string {
  return createHmac('sha512', apiKey).update(payload).digest('base64')
}

/** Concatenate fields in the given order, treating missing values as ''. */
export function buildHashPayload(
  fields: readonly string[],
  values: Record<string, string | undefined>,
): string {
  return fields.map((field) => values[field] ?? '').join('')
}

export class PaywayProvider implements PaymentProvider {
  readonly name = 'payway'

  private readonly merchantId: string
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(options: PaywayOptions = {}) {
    const merchantId = options.merchantId ?? process.env.PAYWAY_MERCHANT_ID
    const apiKey = options.apiKey ?? process.env.PAYWAY_API_KEY

    if (!merchantId || !apiKey) {
      throw new PaymentConfigError(
        'PAYWAY_MERCHANT_ID and PAYWAY_API_KEY must be set to use the PayWay provider.',
      )
    }

    this.merchantId = merchantId
    this.apiKey = apiKey
    this.baseUrl =
      options.baseUrl ??
      process.env.PAYWAY_BASE_URL ??
      'https://checkout-sandbox.payway.com.kh'
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    // PayWay wants YYYYMMDDHHmmss in UTC.
    const reqTime = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)

    const values: Record<string, string> = {
      req_time: reqTime,
      merchant_id: this.merchantId,
      tran_id: request.reference,
      amount: request.amount.toFixed(2),
      items: '',
      shipping: '0.00',
      firstname: '',
      lastname: '',
      email: request.email ?? '',
      phone: '',
      type: 'purchase',
      // 'abapay_khqr' renders a KHQR code; cards use 'cards'. Left broad so the
      // hosted page offers both rather than forcing a choice up front.
      payment_option: '',
      return_url: request.callbackUrl,
      cancel_url: request.returnUrl,
      continue_success_url: request.returnUrl,
      return_deeplink: '',
      currency: request.currency,
      custom_fields: '',
      return_params: request.reference,
    }

    values.hash = paywayHash(buildHashPayload(PURCHASE_HASH_FIELDS, values), this.apiKey)

    // A form POST, not a redirect: the hash and fields must travel in the body.
    return {
      redirectUrl: null,
      formAction: `${this.baseUrl}/api/payment-gateway/v1/payments/purchase`,
      formFields: values,
    }
  }

  /** `headers` is part of the interface but unused here: PayWay signs the body
   *  fields, not a header, unlike most Western processors. */
  verifyWebhook(rawBody: string, _headers?: Headers): VerifyResult {
    void _headers

    let parsed: Record<string, unknown>

    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      // PayWay may post form-encoded rather than JSON depending on config.
      parsed = Object.fromEntries(new URLSearchParams(rawBody))
    }

    const str = (key: string): string | undefined => {
      const value = parsed[key]
      return value == null ? undefined : String(value)
    }

    const tranId = str('tran_id')
    const providedHash = str('hash')

    if (!tranId || !providedHash) return { ok: false, reason: 'malformed' }

    const expected = paywayHash(
      buildHashPayload(CALLBACK_HASH_FIELDS, {
        tran_id: tranId,
        apv: str('apv'),
        status: str('status'),
      }),
      this.apiKey,
    )

    const expectedBuffer = Buffer.from(expected)
    const providedBuffer = Buffer.from(providedHash)

    // Length check first — timingSafeEqual throws on mismatched buffers.
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return { ok: false, reason: 'bad-signature' }
    }

    const amountRaw = str('amount')

    return {
      ok: true,
      event: {
        // PayWay does not send a separate event id, so the transaction id plus
        // its status IS the idempotency key: a later refund on the same
        // transaction is a distinct event and must not be deduped against the
        // original payment.
        eventId: `${tranId}:${str('status') ?? 'na'}`,
        type: mapStatus(str('status')),
        reference: tranId,
        providerRef: str('apv') ?? tranId,
        amount: amountRaw == null ? null : Number(amountRaw),
        currency: str('currency') ?? null,
        raw: parsed,
      },
    }
  }
}

/**
 * PayWay status codes → our event vocabulary.
 *
 * `0` is success. Anything unrecognised maps to `unknown`, which the transition
 * layer ignores rather than guessing — a status we do not understand must never
 * grant access.
 */
export function mapStatus(status: string | undefined): PaymentEventType {
  switch (status) {
    case '0':
    case '00':
    case 'APPROVED':
      return 'payment.succeeded'
    case '1':
    case '2':
    case '3':
    case '4':
    case 'DECLINED':
      return 'payment.failed'
    case 'REFUNDED':
      return 'payment.refunded'
    default:
      return 'unknown'
  }
}
