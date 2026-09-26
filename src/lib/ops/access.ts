import { timingSafeEqual } from 'node:crypto'

/**
 * Who may trigger ops endpoints and read the dashboard.
 *
 * Both checks fail closed. An unset secret must not mean "open to everyone":
 * `/api/cron/ingest` can burn a vendor quota and rewrite every row in the
 * database, so an unconfigured deployment refuses the call instead of trusting
 * whoever knocked.
 */

export type CronAuth = { ok: true } | { ok: false; status: 401 | 503; reason: string }

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  // Length is compared first because timingSafeEqual throws on a mismatch. The
  // length of a secret is not the part worth hiding.
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. A manual trigger can
 * use the same header, which keeps one code path for both.
 */
export function authoriseCron(headers: Headers): CronAuth {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    // 503, not 401: the deployment is misconfigured, and the caller (Vercel)
    // should surface it as an ops problem rather than a rejected credential.
    return { ok: false, status: 503, reason: 'CRON_SECRET is not set' }
  }

  const header = headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token || !constantTimeEquals(token, secret)) {
    return { ok: false, status: 401, reason: 'bad cron token' }
  }

  return { ok: true }
}

/**
 * Dashboard access. `role` comes from the `users` table (`'user' | 'admin'`),
 * not an env allowlist — granting access is a DB write (`npm run dev:user --
 * --admin`), not a redeploy. Fails closed: anything other than the literal
 * `'admin'` (including a missing session) is refused.
 */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin'
}
