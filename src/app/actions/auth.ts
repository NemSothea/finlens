'use server'

import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { AuthError } from 'next-auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { signIn, signOut } from '@/auth'
import { hashPassword } from '@/lib/auth/password'

export type AuthFormState = { error: string | null }

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

/**
 * Registration.
 *
 * Deliberately returns the SAME message whether or not the email is already
 * taken. Distinguishing the two turns this form into an account enumerator:
 * anyone could test an email list and learn who has an account here.
 */
export async function registerUser(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid details' }
  }

  const { email, password } = parsed.data

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!existing) {
    await db.insert(users).values({
      id: randomUUID(),
      email,
      passwordHash: await hashPassword(password),
    })
  }

  // Whether the account was just created or already existed, the next step is
  // the same: try to sign in. A wrong password on an existing account fails
  // here with the generic credentials error.
  return signInWithCredentials({ error: null }, formData)
}

export async function signInWithCredentials(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid details' }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/watchlist',
    })
    return { error: null }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Wrong email or password.' }
    }
    // A successful sign-in also throws — Next's redirect signal. It must
    // propagate, or the redirect never happens and the form reports a
    // phantom failure.
    throw error
  }
}

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/watchlist' })
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' })
}
