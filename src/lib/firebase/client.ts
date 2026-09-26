'use client'

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  type Auth,
} from 'firebase/auth'

/**
 * Browser-side Firebase — used ONLY to sign in and obtain an ID token.
 *
 * Persistence is in-memory: the client SDK forgets the user on reload, and the
 * httpOnly session cookie minted by `/api/auth/session` is the only thing that
 * keeps someone signed in. Two independent notions of "signed in" (IndexedDB
 * on the client, a cookie on the server) would inevitably disagree.
 *
 * The browser never reads or writes Firestore — `firestore.rules` denies it.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST

let authInstance: Promise<Auth> | null = null

export function getClientAuth(): Promise<Auth> {
  authInstance ??= (async () => {
    const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config)
    const auth = getAuth(app)
    if (emulatorHost) connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true })
    await setPersistence(auth, inMemoryPersistence)
    return auth
  })()
  return authInstance
}

/** Trade a fresh ID token for the server session cookie. */
export async function createServerSession(idToken: string): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('SESSION_FAILED')
}
