import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_AUTH_AGE_SECONDS, signTelegramPayload, verifyTelegramLogin } from './telegram'

describe('telegram login verification', () => {
  const BOT_TOKEN = '123456:test-bot-token'
  const now = 1_700_000_000

  function payload(over: Record<string, string> = {}) {
    return signTelegramPayload(
      {
        id: '987654321',
        first_name: 'Dara',
        username: 'dara',
        auth_date: String(now - 60),
        ...over,
      },
      BOT_TOKEN,
    )
  }

  test('accepts a correctly signed payload', () => {
    const result = verifyTelegramLogin(payload(), BOT_TOKEN, now)

    assert.equal(result.ok, true)
    assert.equal(result.ok && result.userId, '987654321')
    assert.equal(result.ok && result.username, 'dara')
    assert.equal(result.ok && result.name, 'Dara')
  })

  test('rejects a tampered field', () => {
    // The whole point: without this check anyone could sign in as any user.
    const tampered = { ...payload(), id: '111111111' }
    const result = verifyTelegramLogin(tampered, BOT_TOKEN, now)

    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.reason, 'bad-signature')
  })

  test('rejects a payload signed with a different bot token', () => {
    const foreign = signTelegramPayload(
      { id: '1', first_name: 'Mallory', auth_date: String(now) },
      'attacker-token',
    )

    const result = verifyTelegramLogin(foreign, BOT_TOKEN, now)
    assert.equal(result.ok === false && result.reason, 'bad-signature')
  })

  test('rejects a stale login', () => {
    // The signature never expires on its own, so a captured payload would work
    // forever without a freshness window.
    const old = payload({ auth_date: String(now - MAX_AUTH_AGE_SECONDS - 1) })
    const result = verifyTelegramLogin(old, BOT_TOKEN, now)

    assert.equal(result.ok === false && result.reason, 'expired')
  })

  test('accepts a login inside the freshness window', () => {
    const recent = payload({ auth_date: String(now - MAX_AUTH_AGE_SECONDS + 10) })
    assert.equal(verifyTelegramLogin(recent, BOT_TOKEN, now).ok, true)
  })

  test('checks the signature before freshness', () => {
    // An unsigned payload must never get a different error path that confirms
    // its timestamp was otherwise acceptable.
    const forged = { ...payload({ auth_date: String(now - 999_999) }), hash: 'ff'.repeat(32) }
    const result = verifyTelegramLogin(forged, BOT_TOKEN, now)

    assert.equal(result.ok === false && result.reason, 'bad-signature')
  })

  test('rejects missing required fields', () => {
    const withoutId: Record<string, string | undefined> = { ...payload() }
    delete withoutId.id

    const result = verifyTelegramLogin(withoutId as never, BOT_TOKEN, now)

    assert.equal(result.ok === false && result.reason, 'missing-fields')
  })

  test('rejects a malformed hash without throwing', () => {
    const result = verifyTelegramLogin({ ...payload(), hash: 'not-hex' }, BOT_TOKEN, now)
    assert.equal(result.ok, false)
  })

  test('fails closed when no bot token is configured', () => {
    // Misconfiguration must deny access, never allow it.
    const result = verifyTelegramLogin(payload(), undefined, now)
    assert.equal(result.ok === false && result.reason, 'no-bot-token')
  })
})
