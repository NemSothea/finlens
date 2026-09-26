import type { NextRequest } from 'next/server'
import { authoriseCron } from '@/lib/ops/access'
import { alertOnHealth, loadHealth } from '@/lib/ops/queries'

/**
 * GET /api/cron/health
 *
 * The watchdog. Runs hourly, compares every stage against its freshness policy
 * and pushes an alert when something is wrong.
 *
 * It is deliberately separate from the ingest cron: an ingest run that dies
 * before writing its own status — OOM, timeout, killed container — cannot report
 * itself. Something that never ingests has to do the noticing.
 *
 * The response body is the same report the dashboard renders, so an external
 * uptime monitor can watch this URL and needs no extra endpoint.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = authoriseCron(request.headers)
  if (!auth.ok) {
    console.warn(`[cron:health] refused: ${auth.reason}`)
    return Response.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const now = new Date()
  const { report } = await loadHealth(now)
  const outcome = await alertOnHealth(report, now)

  return Response.json(
    {
      overall: report.overall,
      checkedAt: report.checkedAt.toISOString(),
      alert: outcome,
      problems: report.problems.map((s) => ({
        stage: s.stage,
        state: s.state,
        severity: s.severity,
        ageHours: s.ageHours === null ? null : Number(s.ageHours.toFixed(2)),
        stalenessHours: s.stalenessHours,
        itemsFailed: s.itemsFailed,
      })),
      stages: report.stages.map((s) => ({
        stage: s.stage,
        state: s.state,
        lastSuccessAt: s.lastSuccessAt?.toISOString() ?? null,
      })),
    },
    {
      // 503 when a critical stage is broken, so a plain uptime check on this URL
      // is enough to catch it — no log reading, no dashboard visit.
      status: report.overall === 'down' ? 503 : 200,
      headers: { 'cache-control': 'no-store' },
    },
  )
}
