/**
 * Local development helper — create or reset an email/password user.
 *
 *   npm run dev:user -- --email=you@example.com --password=at-least-8-chars
 *   npm run dev:user -- --email=you@example.com --password=at-least-8-chars --admin
 *
 * Development only. Creates the Firebase Auth record, sets the `role` custom
 * claim (which gates the `/ops` dashboard) and writes the `users/{uid}` mirror.
 * A role change takes effect on the user's next sign-in, when a new session
 * cookie picks up the claim.
 */
import '@/lib/env'
import { adminAuth, db } from '@/db'
import { refs, type UserDoc } from '@/db/schema'

function arg(name: string, fallback?: string): string {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  const value = hit?.split('=').slice(1).join('=') ?? fallback
  if (!value) {
    console.error(`Missing --${name}=`)
    process.exit(1)
  }
  return value
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    // Refuse outright rather than trusting the operator to have meant it.
    console.error('Refusing to run against a production environment.')
    process.exit(1)
  }

  const email = arg('email').trim().toLowerCase()
  const password = arg('password')
  const role = process.argv.includes('--admin') ? 'admin' : 'user'

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  let uid: string
  let verb: string
  try {
    const existing = await adminAuth.getUserByEmail(email)
    await adminAuth.updateUser(existing.uid, { password })
    uid = existing.uid
    verb = 'Reset password for'
  } catch {
    uid = (await adminAuth.createUser({ email, password })).uid
    verb = 'Created'
  }

  await adminAuth.setCustomUserClaims(uid, { role })

  const ref = refs.user(uid)
  const snap = await ref.get()
  if (snap.exists) {
    await ref.update({ email, role })
  } else {
    const doc: UserDoc = { email, name: null, image: null, role, createdAt: new Date() }
    await ref.set(doc)
  }

  console.log(`${verb} ${email} (${uid}), role=${role}`)
  await db.terminate()
}

main().catch(async (error) => {
  console.error(error)
  await db.terminate().catch(() => {})
  process.exit(1)
})
