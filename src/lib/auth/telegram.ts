import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Telegram Login Widget verification.
 *
 * Telegram signs the login payload with a key derived from the bot token; the
 * server must recompute that signature before trusting any field. Skipping this
 * check would let anyone POST an arbitrary `id` and sign in as any user — the
 * payload is fully attacker-controlled until the HMAC is verified.
 *
 * Algorithm (per Telegram's documented widget flow):
 *   secret_key       = SHA256(bot_token)
 *   data_check_string = every field except `hash`, as "key=value",
 *                       sorted by key, joined with "\n"
 *   expected          = HMAC_SHA256(data_check_string, secret_key)
 *   valid             = expected === hash
 */

export interface TelegramLoginPayload {
  id: string
  hash: string
  auth_date: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  [key: string]: string | undefined
}

export type TelegramVerifyResult =
  | { ok: true; userId: string; username: string | null; name: string | null; photoUrl: string | null }
  | { ok: false; reason: 'missing-fields' | 'bad-signature' | 'expired' | 'no-bot-token' }

/** Logins older than this are rejected — a captured payload stays valid forever
 *  otherwise, since the signature itself never expires. */
export const MAX_AUTH_AGE_SECONDS = 86_400

export function verifyTelegramLogin(
  payload: TelegramLoginPayload,
  botToken: string | undefined = process.env.AUTH_TELEGRAM_BOT_TOKEN,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): TelegramVerifyResult {
  if (!botToken) return { ok: false, reason: 'no-bot-token' }

  const { hash, ...fields } = payload
  if (!hash || !fields.id || !fields.auth_date) return { ok: false, reason: 'missing-fields' }

  const dataCheckString = Object.keys(fields)
    .filter((key) => fields[key] !== undefined && fields[key] !== '')
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n')

  const secretKey = createHash('sha256').update(botToken).digest()
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  const expectedBuffer = Buffer.from(expected, 'hex')
  const providedBuffer = Buffer.from(hash, 'hex')

  // Length check first — timingSafeEqual throws on mismatched buffers.
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return { ok: false, reason: 'bad-signature' }
  }

  // Freshness is checked only AFTER the signature, so an unsigned payload can
  // never reveal anything through a different error path.
  const authDate = Number(fields.auth_date)
  if (!Number.isFinite(authDate) || nowSeconds - authDate > MAX_AUTH_AGE_SECONDS) {
    return { ok: false, reason: 'expired' }
  }

  const name = [fields.first_name, fields.last_name].filter(Boolean).join(' ') || null

  return {
    ok: true,
    userId: fields.id,
    username: fields.username ?? null,
    name,
    photoUrl: fields.photo_url ?? null,
  }
}

/** Test helper and local tooling: produce a correctly signed payload. */
export function signTelegramPayload(
  fields: Record<string, string>,
  botToken: string,
): TelegramLoginPayload {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n')

  const secretKey = createHash('sha256').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  return { ...fields, hash } as TelegramLoginPayload
}
