'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth } from '@/db'
import { SESSION_COOKIE } from '@/auth'

/**
 * Sign-in and registration happen in the browser with the Firebase client SDK
 * (see `signin-form.tsx`) — passwords never pass through this server. What is
 * left server side is ending the session.
 *
 * Revoking refresh tokens, not just deleting the cookie: `auth()` verifies
 * with revocation checks on, so a copy of the cookie taken before sign-out
 * stops working immediately instead of living out its five days.
 */
export async function signOutAction() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decoded.sub)
    } catch {
      // Already invalid; nothing to revoke.
    }
  }

  cookieStore.delete(SESSION_COOKIE)
  redirect('/')
}
