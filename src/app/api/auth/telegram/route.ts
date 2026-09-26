import type { NextRequest } from 'next/server'
import { adminAuth } from '@/db'
import { verifyTelegramLogin, type TelegramLoginPayload } from '@/lib/auth/telegram'

/**
 * Telegram Login Widget → Firebase custom token.
 *
 * Firebase Auth has no Telegram provider, so the server does what the provider
 * would: verify Telegram's HMAC, then vouch for the user with a custom token.
 * The browser signs in with `signInWithCustomToken` and exchanges the result
 * for a session cookie like every other method.
 *
 * Every field of the payload is attacker-controlled until the HMAC checks out,
 * so nothing is read from it before `verifyTelegramLogin` says ok. The Firebase
 * uid is namespaced (`telegram:<id>`) so a Telegram id can never collide with a
 * uid issued by another provider.
 */

export async function POST(request: NextRequest) {
  let payload: TelegramLoginPayload
  try {
    payload = (await request.json()) as TelegramLoginPayload
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  const verified = verifyTelegramLogin(payload)
  if (!verified.ok) {
    // One status for every failure; the reason is logged, not returned.
    console.warn(`[auth:telegram] refused: ${verified.reason}`)
    return Response.json({ error: 'Telegram sign-in failed' }, { status: 401 })
  }

  const uid = `telegram:${verified.userId}`
  const displayName = verified.name ?? verified.username ?? `Telegram ${verified.userId}`

  try {
    await adminAuth.getUser(uid)
  } catch {
    // First Telegram login. Telegram gives no email, so the Auth record has
    // none — rather than a fake id@telegram.local that would look deliverable.
    await adminAuth.createUser({
      uid,
      displayName,
      ...(verified.photoUrl ? { photoURL: verified.photoUrl } : {}),
    })
  }

  const customToken = await adminAuth.createCustomToken(uid)
  return Response.json({ customToken })
}
