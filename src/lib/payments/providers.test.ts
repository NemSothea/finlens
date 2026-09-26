import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildHashPayload, mapStatus, paywayHash, PaywayProvider } from './payway'
import { ManualProvider, manualSignature } from './manual'
import { PaymentConfigError } from './types'

const MERCHANT_ID = 'test_merchant'
const API_KEY = 'test_api_key'
const MANUAL_SECRET = 'manual-test-secret'

function payway() {
  return new PaywayProvider({ merchantId: MERCHANT_ID, apiKey: API_KEY })
}

function manual() {
  return new ManualProvider({ secret: MANUAL_SECRET })
}

describe('paywayHash', () => {
  test('is deterministic', () => {
    assert.equal(paywayHash('abc', API_KEY), paywayHash('abc', API_KEY))
  })

  test('changes with the payload', () => {
    assert.notEqual(paywayHash('abc', API_KEY), paywayHash('abd', API_KEY))
  })

  test('changes with the key', () => {
    assert.notEqual(paywayHash('abc', API_KEY), paywayHash('abc', 'other_key'))
  })

  test('is base64', () => {
    const hash = paywayHash('abc', API_KEY)
    assert.match(hash, /^[A-Za-z0-9+/]+=*$/)
    // SHA-512 is 64 bytes → 88 base64 characters with padding.
    assert.equal(hash.length, 88)
  })
})

describe('buildHashPayload', () => {
  test('concatenates in the declared order', () => {
    assert.equal(buildHashPayload(['a', 'b', 'c'], { a: '1', b: '2', c: '3' }), '123')
  })

  test('order changes the payload — which is why field order matters', () => {
    const values = { a: '1', b: '2' }
    assert.notEqual(buildHashPayload(['a', 'b'], values), buildHashPayload(['b', 'a'], values))
  })

  test('treats missing fields as empty strings, not "undefined"', () => {
    assert.equal(buildHashPayload(['a', 'b'], { a: '1' }), '1')
  })
})

describe('PaywayProvider — checkout', () => {
  test('returns a signed form POST rather than a redirect', async () => {
    const session = await payway().createCheckout({
      reference: 'fl_abc',
      plan: 'pro_monthly',
      amount: 5,
      currency: 'USD',
      userId: 'u1',
      email: 'a@b.com',
      returnUrl: 'https://example.com/pricing',
      callbackUrl: 'https://example.com/api/payments/webhook/payway',
    })

    assert.equal(session.redirectUrl, null)
    assert.ok(session.formAction?.includes('/payments/purchase'))
    assert.equal(session.formFields?.tran_id, 'fl_abc')
    // Amount must carry two decimals or the hash will not match PayWay's.
    assert.equal(session.formFields?.amount, '5.00')
    assert.ok(session.formFields?.hash)
  })

  test('the hash covers the amount', async () => {
    const base = {
      plan: 'pro_monthly' as const,
      currency: 'USD',
      userId: 'u1',
      email: 'a@b.com',
      returnUrl: 'https://example.com/pricing',
      callbackUrl: 'https://example.com/cb',
    }

    const five = await payway().createCheckout({ ...base, reference: 'fl_x', amount: 5 })
    const fifty = await payway().createCheckout({ ...base, reference: 'fl_x', amount: 50 })

    assert.notEqual(five.formFields?.hash, fifty.formFields?.hash)
  })

  test('refuses to construct without credentials', () => {
    assert.throws(
      () => new PaywayProvider({ merchantId: undefined, apiKey: undefined }),
      PaymentConfigError,
    )
  })
})

describe('PaywayProvider — webhook verification', () => {
  function signedCallback(fields: Record<string, string>) {
    const hash = paywayHash(
      buildHashPayload(['tran_id', 'apv', 'status'], fields),
      API_KEY,
    )
    return JSON.stringify({ ...fields, hash })
  }

  test('accepts a correctly signed callback', () => {
    const body = signedCallback({ tran_id: 'fl_1', apv: 'apv1', status: '0', amount: '5' })
    const result = payway().verifyWebhook(body, new Headers())

    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.event.type, 'payment.succeeded')
    assert.equal(result.event.reference, 'fl_1')
    assert.equal(result.event.amount, 5)
  })

  test('rejects a tampered status', () => {
    // The attack this exists to stop: flipping a decline into an approval.
    const body = signedCallback({ tran_id: 'fl_1', apv: 'apv1', status: '1' })
    const forged = JSON.parse(body)
    forged.status = '0'

    const result = payway().verifyWebhook(JSON.stringify(forged), new Headers())
    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.reason, 'bad-signature')
  })

  test('rejects a callback signed with someone else’s key', () => {
    const other = new PaywayProvider({ merchantId: MERCHANT_ID, apiKey: 'attacker_key' })
    const body = signedCallback({ tran_id: 'fl_1', apv: 'a', status: '0' })

    const result = other.verifyWebhook(body, new Headers())
    assert.equal(result.ok === false && result.reason, 'bad-signature')
  })

  test('rejects a callback with no hash at all', () => {
    const body = JSON.stringify({ tran_id: 'fl_1', status: '0' })
    assert.equal(payway().verifyWebhook(body, new Headers()).ok, false)
  })

  test('rejects unparseable bodies without throwing', () => {
    for (const body of ['', 'not json', '{']) {
      assert.equal(payway().verifyWebhook(body, new Headers()).ok, false)
    }
  })

  test('accepts form-encoded callbacks too', () => {
    const fields = { tran_id: 'fl_2', apv: 'apv2', status: '0' }
    const hash = paywayHash(buildHashPayload(['tran_id', 'apv', 'status'], fields), API_KEY)
    const body = new URLSearchParams({ ...fields, hash }).toString()

    assert.equal(payway().verifyWebhook(body, new Headers()).ok, true)
  })

  test('distinguishes a refund from the original payment on the same transaction', () => {
    // The event id must include the status, or a later refund would be deduped
    // against the original payment and silently dropped.
    const paid = payway().verifyWebhook(
      signedCallback({ tran_id: 'fl_3', apv: 'a', status: '0' }),
      new Headers(),
    )
    const refunded = payway().verifyWebhook(
      signedCallback({ tran_id: 'fl_3', apv: 'a', status: 'REFUNDED' }),
      new Headers(),
    )

    assert.ok(paid.ok && refunded.ok)
    if (!paid.ok || !refunded.ok) return
    assert.notEqual(paid.event.eventId, refunded.event.eventId)
  })
})

describe('mapStatus', () => {
  test('maps approvals to success', () => {
    for (const status of ['0', '00', 'APPROVED']) {
      assert.equal(mapStatus(status), 'payment.succeeded')
    }
  })

  test('maps declines to failure', () => {
    for (const status of ['1', '2', 'DECLINED']) {
      assert.equal(mapStatus(status), 'payment.failed')
    }
  })

  test('maps anything unrecognised to unknown, never to success', () => {
    for (const status of [undefined, '', 'weird', 'ok', 'success']) {
      assert.equal(mapStatus(status), 'unknown')
    }
  })
})

describe('ManualProvider', () => {
  test('accepts a correctly signed event', () => {
    const body = JSON.stringify({
      eventId: 'evt_1',
      type: 'payment.succeeded',
      reference: 'fl_1',
      amount: 5,
    })
    const headers = new Headers({ 'x-finlens-signature': manualSignature(body, MANUAL_SECRET) })

    const result = manual().verifyWebhook(body, headers)
    assert.equal(result.ok, true)
    assert.equal(result.ok && result.event.eventId, 'evt_1')
  })

  test('rejects a tampered body', () => {
    // Proves the dev provider is not a verification bypass.
    const body = JSON.stringify({ eventId: 'evt_1', type: 'payment.succeeded', reference: 'fl_1' })
    const signature = manualSignature(body, MANUAL_SECRET)
    const tampered = JSON.stringify({
      eventId: 'evt_1',
      type: 'payment.succeeded',
      reference: 'fl_HIJACKED',
    })

    const result = manual().verifyWebhook(
      tampered,
      new Headers({ 'x-finlens-signature': signature }),
    )
    assert.equal(result.ok === false && result.reason, 'bad-signature')
  })

  test('rejects a missing signature header', () => {
    const body = JSON.stringify({ eventId: 'e', reference: 'r' })
    assert.equal(manual().verifyWebhook(body, new Headers()).ok, false)
  })

  test('maps unrecognised event types to unknown', () => {
    const body = JSON.stringify({ eventId: 'e', type: 'free.pro.please', reference: 'r' })
    const headers = new Headers({ 'x-finlens-signature': manualSignature(body, MANUAL_SECRET) })

    const result = manual().verifyWebhook(body, headers)
    assert.equal(result.ok && result.event.type, 'unknown')
  })

  test('refuses to construct without a secret', () => {
    // No default secret — a fallback would ship a forgeable webhook.
    assert.throws(() => new ManualProvider({ secret: undefined }), PaymentConfigError)
  })
})
