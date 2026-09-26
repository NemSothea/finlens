import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, needsRehash, verifyPassword } from './password'
import { MAX_AUTH_AGE_SECONDS, signTelegramPayload, verifyTelegramLogin } from './telegram'

describe('password hashing', () => {
  test('accepts the correct password', async () => {
    const stored = await hashPassword('correct horse battery')
    assert.equal(await verifyPassword('correct horse battery', stored), true)
  })

  test('rejects the wrong password', async () => {
    const stored = await hashPassword('correct horse battery')
    assert.equal(await verifyPassword('correct horse batteri', stored), false)
  })

  test('salts, so identical passwords hash differently', async () => {
    // Without a per-password salt, a single rainbow table breaks every account.
    const a = await hashPassword('same password here')
    const b = await hashPassword('same password here')

    assert.notEqual(a, b)
    assert.equal(await verifyPassword('same password here', a), true)
    assert.equal(await verifyPassword('same password here', b), true)
  })

  test('stores its parameters so they can be raised later', async () => {
    const stored = await hashPassword('a good long password')
    const [scheme, n, r, p] = stored.split('$')

    assert.equal(scheme, 'scrypt')
    assert.ok(Number(n) >= 32_768)
    assert.ok(Number(r) >= 8)
    assert.ok(Number(p) >= 1)
  })

  test('never stores the password in the hash string', async () => {
    const stored = await hashPassword('hunter2-is-a-bad-password')
    assert.ok(!stored.includes('hunter2'))
  })

  test('rejects passwords under 8 characters', async () => {
    await assert.rejects(() => hashPassword('short'), /at least 8/)
  })

  test('normalises unicode so the same typed password always matches', async () => {
    // "é" composed vs decomposed are different byte sequences but the same
    // password to a human — and to a different keyboard or OS.
    const composed = 'caf\u00E9-password'
    const decomposed = 'cafe\u0301-password'

    assert.notEqual(composed, decomposed, 'forms must differ before normalisation')

    const stored = await hashPassword(composed)
    assert.equal(await verifyPassword(decomposed, stored), true)
  })

  test('returns false for a malformed stored hash instead of throwing', async () => {
    for (const bad of ['', 'garbage', 'scrypt$only$four$parts', 'bcrypt$1$2$3$4$5', 'scrypt$x$y$z$aa$bb']) {
      assert.equal(await verifyPassword('any password', bad), false)
    }
  })

  test('flags weak or foreign hashes for rehashing', async () => {
    assert.equal(needsRehash(await hashPassword('a good long password')), false)
    assert.equal(needsRehash('scrypt$1024$8$1$aa$bb'), true)
    assert.equal(needsRehash('bcrypt$whatever'), true)
  })
})

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
