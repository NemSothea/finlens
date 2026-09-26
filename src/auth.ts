import NextAuth, { type DefaultSession } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { accounts, sessions, users, verificationTokens } from '@/db/schema'
import { verifyPassword } from '@/lib/auth/password'
import { verifyTelegramLogin, type TelegramLoginPayload } from '@/lib/auth/telegram'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & { id: string; role: string }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string
  }
}

/**
 * Auth.js v5 configuration.
 *
 * Session strategy is JWT, not database. That is forced rather than chosen: the
 * Credentials provider cannot issue database sessions in Auth.js v5. The adapter
 * is still wired up because it handles OAuth account linking and user records —
 * the `sessions` table simply goes unused until credentials are dropped.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/signin',
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),

    Credentials({
      id: 'credentials',
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : ''
        const password = typeof raw?.password === 'string' ? raw.password : ''
        if (!email || !password) return null

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

        // Return null for every failure — never distinguish "no such account"
        // from "wrong password", or the endpoint becomes an account enumerator.
        if (!user?.passwordHash) return null
        if (!(await verifyPassword(password, user.passwordHash))) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),

    Credentials({
      id: 'telegram',
      name: 'Telegram',
      // The Telegram Login Widget posts these fields; every one of them is
      // attacker-controlled until verifyTelegramLogin checks the HMAC.
      credentials: {
        id: { label: 'id', type: 'text' },
        hash: { label: 'hash', type: 'text' },
        auth_date: { label: 'auth_date', type: 'text' },
        first_name: { label: 'first_name', type: 'text' },
        last_name: { label: 'last_name', type: 'text' },
        username: { label: 'username', type: 'text' },
        photo_url: { label: 'photo_url', type: 'text' },
      },
      async authorize(raw) {
        const verified = verifyTelegramLogin(raw as unknown as TelegramLoginPayload)
        if (!verified.ok) return null

        const providerAccountId = verified.userId

        const [existing] = await db
          .select({ userId: accounts.userId })
          .from(accounts)
          .where(eq(accounts.providerAccountId, providerAccountId))
          .limit(1)

        if (existing) {
          const [user] = await db.select().from(users).where(eq(users.id, existing.userId)).limit(1)
          if (user) return { id: user.id, name: user.name, email: user.email, image: user.image }
        }

        // First Telegram login: create the user and link the account. Telegram
        // gives no email, so the column stays null — which is why `email` is
        // nullable in the schema rather than being faked as id@telegram.local.
        const id = randomUUID()

        await db.insert(users).values({
          id,
          name: verified.name ?? verified.username ?? `Telegram ${providerAccountId}`,
          image: verified.photoUrl,
        })

        await db.insert(accounts).values({
          userId: id,
          type: 'oauth',
          provider: 'telegram',
          providerAccountId,
        })

        return { id, name: verified.name, email: null, image: verified.photoUrl }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Persist the DB id and role on first sign-in; later calls only carry
      // the token. A role granted after sign-in takes effect on next login —
      // same trade-off already made for everything else on the token.
      if (user?.id) {
        token.sub = user.id
        const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1)
        token.role = row?.role ?? 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      session.user.role = typeof token.role === 'string' ? token.role : 'user'
      return session
    },
  },
})

/** Throwing accessor for server code that must have a user. */
export async function requireUserId(): Promise<string> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) throw new Error('UNAUTHENTICATED')
  return id
}
