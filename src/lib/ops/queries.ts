import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { ingestRuns, opsAlerts } from '@/db/schema'
import { assessHealth, healthFingerprint, type HealthReport, type RunRow } from './health'
import { formatAlert, sendTelegram, shouldSend } from './alerts'

/**
 * The only part of the ops layer that touches Postgres.
 *
 * `health.ts` and `alerts.ts` stay import-free of the database so the
 * assessment and the message text can be unit-tested without one — importing
 * `@/db` at module load would make every ops test need a live connection.
 */

/** Recent runs, newest first — the dashboard's run log and the health input. */
export async function loadRuns(limit = 60): Promise<RunRow[]> {
  const rows = await db.select().from(ingestRuns).orderBy(desc(ingestRuns.startedAt)).limit(limit)
  return rows as RunRow[]
}

export async function loadHealth(now: Date = new Date()): Promise<{
  report: HealthReport
  runs: RunRow[]
}> {
  // Enough rows to find the last success per stage even after a bad night of
  // retries, without reading the whole table.
  const runs = await loadRuns(120)
  return { report: assessHealth(runs, now), runs }
}

export type AlertOutcome =
  | { sent: true; kind: 'problem' | 'recovery'; fingerprint: string }
  | { sent: false; reason: 'healthy' | 'cooldown' | 'send-failed' }

/**
 * Decide and send. Called from both cron endpoints.
 *
 * The dedupe row is written only after a successful send, so a failed send is
 * retried on the next check rather than being silently swallowed by the
 * cooldown it never earned.
 */
export async function alertOnHealth(
  report: HealthReport,
  now: Date = new Date(),
  baseUrl = process.env.AUTH_URL,
): Promise<AlertOutcome> {
  const fingerprint = healthFingerprint(report)

  if (report.overall === 'ok') {
    // Recovery: close every open alert, and announce it once. Without this the
    // only recovery signal is silence, which looks the same as a dead alerter.
    const open = await db.select().from(opsAlerts).where(isNull(opsAlerts.resolvedAt))
    if (open.length === 0) return { sent: false, reason: 'healthy' }

    const ok = await sendTelegram(formatAlert(report, baseUrl))

    // Resolved either way: a failed recovery message must not leave the rows
    // open, or the next problem would look like a continuation of the old one.
    await db.update(opsAlerts).set({ resolvedAt: now }).where(isNull(opsAlerts.resolvedAt))

    return ok
      ? { sent: true, kind: 'recovery', fingerprint }
      : { sent: false, reason: 'send-failed' }
  }

  const [existing] = await db
    .select()
    .from(opsAlerts)
    .where(and(eq(opsAlerts.fingerprint, fingerprint), isNull(opsAlerts.resolvedAt)))
    .limit(1)

  if (existing && !shouldSend(existing.lastSentAt, now)) {
    return { sent: false, reason: 'cooldown' }
  }

  const ok = await sendTelegram(formatAlert(report, baseUrl))
  if (!ok) return { sent: false, reason: 'send-failed' }

  await db
    .insert(opsAlerts)
    .values({ fingerprint, firstSeenAt: now, lastSentAt: now, sends: 1, resolvedAt: null })
    .onConflictDoUpdate({
      target: opsAlerts.fingerprint,
      set: { lastSentAt: now, sends: (existing?.sends ?? 0) + 1, resolvedAt: null },
    })

  return { sent: true, kind: 'problem', fingerprint }
}
