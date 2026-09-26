import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth } from '@/db'
import { refs } from '@/db/schema'

/**
 * Firebase Auth, server side.
 *
 * The browser signs in with the Firebase client SDK (email/password, Google,
 * or a custom token for Telegram), then trades the resulting ID token for an
 * httpOnly session cookie at `/api/auth/session`. From then on the server only
 * ever looks at that cookie — the client SDK keeps no persistent state of its
 * own (in-memory persistence), so there is exactly one source of truth for
 * "who is signed in".
 *
 * API clients (the Flutter app) send `Authorization: Bearer <Firebase ID
 * token>` instead; both paths resolve to the same `Session` shape.
 *
 * `role` is a custom claim on the Auth record. It is baked into the session
 * cookie when the cookie is minted, so a role granted later takes effect on
 * next sign-in — the same trade-off the old JWT sessions made.
 */

export const SESSION_COOKIE = '__session'

/** Firebase caps session cookies at 14 days. Five is the documented default. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5

export interface Session {
  user: {
    id: string
    role: string
    email: string | null
    name: string | null
    image: string | null
  }
}

function toSession(token: DecodedIdToken): Session {
  return {
    user: {
      id: token.uid,
      role: typeof token.role === 'string' ? token.role : 'user',
      email: token.email ?? null,
      name: typeof token.name === 'string' ? token.name : null,
      image: typeof token.picture === 'string' ? token.picture : null,
    },
  }
}

/**
 * The current session, or null.
 *
 * `cache()` dedupes within one request — a layout, a page and three actions
 * asking "who is this?" verify the cookie once. `checkRevoked` is on: signing
 * out revokes the user's tokens, and a copied cookie must stop working at that
 * moment rather than when it expires.
 */
export const auth = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value

  if (sessionCookie) {
    try {
      return toSession(await adminAuth.verifySessionCookie(sessionCookie, true))
    } catch {
      // Expired, revoked or forged — all mean "signed out". Never surface why.
      return null
    }
  }

  const authorization = (await headers()).get('authorization') ?? ''
  if (authorization.startsWith('Bearer ')) {
    try {
      return toSession(await adminAuth.verifyIdToken(authorization.slice(7), true))
    } catch {
      return null
    }
  }

  return null
})

/** Throwing accessor for server code that must have a user. */
export async function requireUserId(): Promise<string> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) throw new Error('UNAUTHENTICATED')
  return id
}

/**
 * Keep `users/{uid}` in step with the Auth record. Called whenever a session
 * is minted, so the mirror is at most one sign-in stale. `role` is only
 * written on creation — the custom claim is authoritative, and overwriting it
 * here from a token minted before a grant would undo the grant.
 */
export async function syncUserDoc(token: DecodedIdToken): Promise<void> {
  const ref = refs.user(token.uid)
  const profile = {
    email: token.email ?? null,
    name: typeof token.name === 'string' ? token.name : null,
    image: typeof token.picture === 'string' ? token.picture : null,
  }

  await ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists) {
      tx.update(ref, profile)
    } else {
      tx.set(ref, {
        ...profile,
        role: typeof token.role === 'string' ? token.role : 'user',
        createdAt: new Date(),
      })
    }
  })
}
