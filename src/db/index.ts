import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
}

/**
 * Reuse one client across HMR reloads and serverless invocations. Without the
 * global cache, dev hot-reload opens a new pool per edit and exhausts Postgres
 * connections within a few minutes.
 */
const globalForDb = globalThis as unknown as { __finlensSql?: ReturnType<typeof postgres> }

const sql =
  globalForDb.__finlensSql ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === 'production' ? 10 : 3,
    idle_timeout: 20,
    prepare: false, // required for transaction-mode poolers (Supabase/pgbouncer)
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__finlensSql = sql

export const db = drizzle(sql, { schema })
export { sql, schema }
