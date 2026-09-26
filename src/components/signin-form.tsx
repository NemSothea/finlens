'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential,
} from 'firebase/auth'
import { z } from 'zod'
import { createServerSession, getClientAuth } from '@/lib/firebase/client'

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

/** One message for every credential failure. Distinguishing "no such account"
 *  from "wrong password" turns the form into an account enumerator. */
const WRONG_CREDENTIALS = 'Wrong email or password.'

function describe(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again in a few minutes.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        return WRONG_CREDENTIALS
    }
  }
  return 'Sign-in failed. Please try again.'
}

/**
 * One form, two submit buttons.
 *
 * Sign-in and registration take identical fields, and splitting them across two
 * pages just makes the user guess which one they need.
 *
 * Flow: Firebase client SDK signs in → ID token → `/api/auth/session` mints the
 * httpOnly cookie → the client SDK signs itself out again, because the cookie
 * is the only session the app recognises.
 */
export function SignInForm({ googleEnabled, next }: { googleEnabled: boolean; next: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'register' | 'google' | null>(null)
  const [pending, startTransition] = useTransition()

  function finish(signInFn: () => Promise<UserCredential>, which: 'signin' | 'register' | 'google') {
    setError(null)
    setMode(which)
    startTransition(async () => {
      const auth = await getClientAuth()
      try {
        const credential = await signInFn()
        await createServerSession(await credential.user.getIdToken())
        await signOut(auth)
        router.replace(next)
        router.refresh()
      } catch (e) {
        await signOut(auth).catch(() => {})
        setError(describe(e))
      }
    })
  }

  function parse(formData: FormData) {
    const parsed = credentialsSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid details')
      return null
    }
    return parsed.data
  }

  function onSignIn(formData: FormData) {
    const creds = parse(formData)
    if (!creds) return
    finish(async () => {
      const auth = await getClientAuth()
      return signInWithEmailAndPassword(auth, creds.email, creds.password)
    }, 'signin')
  }

  function onRegister(formData: FormData) {
    const creds = parse(formData)
    if (!creds) return
    finish(async () => {
      const auth = await getClientAuth()
      try {
        return await createUserWithEmailAndPassword(auth, creds.email, creds.password)
      } catch (e) {
        // Existing account: behave exactly like sign-in, so "already taken"
        // is never revealed. A wrong password fails with the generic message.
        if (e instanceof FirebaseError && e.code === 'auth/email-already-in-use') {
          return signInWithEmailAndPassword(auth, creds.email, creds.password)
        }
        throw e
      }
    }, 'register')
  }

  function onGoogle() {
    finish(async () => {
      const auth = await getClientAuth()
      return signInWithPopup(auth, new GoogleAuthProvider())
    }, 'google')
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-400">At least 8 characters.</p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            formAction={onSignIn}
            disabled={pending}
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending && mode === 'signin' ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="submit"
            formAction={onRegister}
            disabled={pending}
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition disabled:opacity-50 dark:border-zinc-700"
          >
            {pending && mode === 'register' ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>

      {googleEnabled ? (
        <button
          type="button"
          onClick={onGoogle}
          disabled={pending}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {pending && mode === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>
      ) : (
        <p className="text-xs text-zinc-400">
          Google sign-in is hidden because NEXT_PUBLIC_AUTH_GOOGLE_ENABLED is not set.
        </p>
      )}
    </div>
  )
}
