/**
 * Local development helper — create or reset a credentials user.
 *
 *   npm run dev:user -- --email=you@example.com --password=at-least-8-chars
 *   npm run dev:user -- --email=you@example.com --password=at-least-8-chars --admin
 *
 * Development only. There is no admin UI yet, and signing in through the web
 * form is a slow way to get a test account into a fresh database. `--admin`
 * sets `role='admin'`, which gates the `/ops` dashboard.
 */
import '@/lib/env'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db, sql } from '@/db'
import { users } from '@/db/schema'
import { hashPassword } from '@/lib/auth/password'

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

  const passwordHash = await hashPassword(password)

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    await db.update(users).set({ passwordHash, role }).where(eq(users.id, existing.id))
    console.log(`Reset password for ${email} (${existing.id}), role=${role}`)
  } else {
    const id = randomUUID()
    await db.insert(users).values({ id, email, passwordHash, role })
    console.log(`Created ${email} (${id}), role=${role}`)
  }

  await sql.end()
}

main().catch(async (error) => {
  console.error(error)
  await sql.end().catch(() => {})
  process.exit(1)
})
