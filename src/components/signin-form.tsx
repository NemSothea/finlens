'use client'

import { useActionState } from 'react'
import {
  registerUser,
  signInWithCredentials,
  signInWithGoogle,
  type AuthFormState,
} from '@/app/actions/auth'

const INITIAL: AuthFormState = { error: null }

/**
 * One form, two submit buttons.
 *
 * Sign-in and registration take identical fields, and splitting them across two
 * pages just makes the user guess which one they need. `useActionState` keeps
 * the server's error message on screen without a client-side fetch.
 */
export function SignInForm({ googleConfigured }: { googleConfigured: boolean }) {
  const [signInState, signInAction, signingIn] = useActionState(signInWithCredentials, INITIAL)
  const [registerState, registerAction, registering] = useActionState(registerUser, INITIAL)

  const error = signInState.error ?? registerState.error
  const busy = signingIn || registering

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
            formAction={signInAction}
            disabled={busy}
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="submit"
            formAction={registerAction}
            disabled={busy}
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition disabled:opacity-50 dark:border-zinc-700"
          >
            {registering ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>

      {googleConfigured ? (
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Continue with Google
          </button>
        </form>
      ) : (
        <p className="text-xs text-zinc-400">
          Google sign-in is hidden because AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are not set.
        </p>
      )}
    </div>
  )
}
