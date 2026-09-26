import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/db'
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, syncUserDoc } from '@/auth'

/**
 * Session cookie exchange.
 *
 * POST { idToken } — the browser has just signed in with the Firebase client
 * SDK. Verify the ID token, mint an httpOnly session cookie, and from here on
 * the server trusts only the cookie.
 *
 * DELETE — sign out: revoke every refresh token for the user (which also
 * invalidates outstanding session cookies, since `auth()` checks revocation)
 * and clear the cookie.
 */

/** Only a sign-in from the last few minutes may be turned into a 5-day
 *  cookie. Without it, an ID token lifted from anywhere in its 1-hour life
 *  could be upgraded into a much longer-lived credential. */
const MAX_SIGN_IN_AGE_SECONDS = 5 * 60

export async function POST(request: NextRequest) {
  let idToken: unknown
  try {
    idToken = ((await request.json()) as { idToken?: unknown }).idToken
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > 8192) {
    return Response.json({ error: 'idToken is required' }, { status: 400 })
  }

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true)
  } catch {
    return Response.json({ error: 'Invalid sign-in' }, { status: 401 })
  }

  if (Date.now() / 1000 - decoded.auth_time > MAX_SIGN_IN_AGE_SECONDS) {
    return Response.json({ error: 'Sign in again' }, { status: 401 })
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  })

  await syncUserDoc(decoded)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return Response.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decoded.sub)
    } catch {
      // Already invalid — clearing the cookie is all that is left to do.
    }
  }

  cookieStore.delete(SESSION_COOKIE)
  return Response.json({ ok: true })
}
