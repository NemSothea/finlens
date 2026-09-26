import { db, toDate } from '@/db'
import { refs, type IngestRunDoc, type OpsAlertDoc } from '@/db/schema'
import { assessHealth, healthFingerprint, type HealthReport, type RunRow } from './health'
import { formatAlert, sendTelegram, shouldSend } from './alerts'

/**
 * The only part of the ops layer that touches Firestore.
 *
 * `health.ts` and `alerts.ts` stay import-free of the database so the
 * assessment and the message text can be unit-tested without one — importing
 * `@/db` at module load would make every ops test need Firebase credentials.
 */

/** Recent runs, newest first — the dashboard's run log and the health input. */
export async function loadRuns(limit = 60): Promise<RunRow[]> {
  const snap = await refs.ingestRuns().orderBy('startedAt', 'desc').limit(limit).get()
  return snap.docs.map((d) => {
    const r = d.data() as IngestRunDoc
    return {
      id: d.id,
      stage: r.stage,
      status: r.status,
      startedAt: toDate(r.startedAt) ?? new Date(0),
      finishedAt: toDate(r.finishedAt),
      itemsOk: r.itemsOk ?? 0,
      itemsFailed: r.itemsFailed ?? 0,
      vendorCalls: r.vendorCalls ?? 0,
      errors: r.errors ?? null,
    }
  })
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
  baseUrl = process.env.APP_URL,
): Promise<AlertOutcome> {
  const fingerprint = healthFingerprint(report)

  if (report.overall === 'ok') {
    // Recovery: close every open alert, and announce it once. Without this the
    // only recovery signal is silence, which looks the same as a dead alerter.
    const open = await refs.opsAlerts().where('resolvedAt', '==', null).get()
    if (open.empty) return { sent: false, reason: 'healthy' }

    const ok = await sendTelegram(formatAlert(report, baseUrl))

    // Resolved either way: a failed recovery message must not leave the rows
    // open, or the next problem would look like a continuation of the old one.
    const writes = db.batch()
    for (const doc of open.docs) writes.update(doc.ref, { resolvedAt: now })
    await writes.commit()

    return ok
      ? { sent: true, kind: 'recovery', fingerprint }
      : { sent: false, reason: 'send-failed' }
  }

  const alertRef = refs.opsAlert(fingerprint)
  const snap = await alertRef.get()
  const stored = snap.exists ? (snap.data() as OpsAlertDoc) : null
  // A resolved alert with the same fingerprint is a new occurrence, not a
  // continuation — it starts its own cooldown.
  const existing = stored && stored.resolvedAt == null ? stored : null

  if (existing && !shouldSend(toDate(existing.lastSentAt) ?? new Date(0), now)) {
    return { sent: false, reason: 'cooldown' }
  }

  const ok = await sendTelegram(formatAlert(report, baseUrl))
  if (!ok) return { sent: false, reason: 'send-failed' }

  const next: OpsAlertDoc = {
    fingerprint,
    firstSeenAt: existing ? (toDate(existing.firstSeenAt) ?? now) : now,
    lastSentAt: now,
    sends: (existing?.sends ?? 0) + 1,
    resolvedAt: null,
  }
  await alertRef.set(next)

  return { sent: true, kind: 'problem', fingerprint }
}
