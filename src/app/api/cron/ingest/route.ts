import type { NextRequest } from 'next/server'
import { authoriseCron } from '@/lib/ops/access'
import { assessHealth } from '@/lib/ops/health'
import { alertOnHealth, loadRuns } from '@/lib/ops/queries'
import { isStageName, runStages } from '@/lib/ingest/pipeline'
import { CRON_GROUPS, isCronGroup, type StageName } from '@/lib/ops/policy'

/**
 * GET /api/cron/ingest?group=daily
 *
 * Scheduled ingest trigger.
 *
 * **Sizing caveat, stated plainly:** a serverless function has a hard wall-clock
 * limit (300s on Vercel's paid tiers). A full 2,000-ticker `financials` pass
 * makes ~6,000 vendor calls at ~4/s and cannot finish inside that. So this
 * endpoint is for slices — `limit` and `symbols` bound the work — and the real
 * nightly pass runs from a plain box or CI runner with `npm run ingest`, which
 * has no timeout. Both paths go through `runStages`, so they write the same
 * `ingest_runs` history and the same dashboard covers both.
 *
 * A stage that throws does not stop the ones after it: one dead vendor endpoint
 * must not skip `valuations`, which needs no vendor at all.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const auth = authoriseCron(request.headers)
  if (!auth.ok) {
    console.warn(`[cron:ingest] refused: ${auth.reason}`)
    return Response.json({ error: 'Unauthorized' }, { status: auth.status })
  }

  const params = request.nextUrl.searchParams
  const group = params.get('group') ?? 'daily'
  const stageParam = params.get('stage')

  let stages: StageName[]

  if (stageParam) {
    if (!isStageName(stageParam)) {
      return Response.json({ error: `Unknown stage ${stageParam}` }, { status: 400 })
    }
    stages = [stageParam]
  } else {
    if (!isCronGroup(group)) {
      return Response.json({ error: `Unknown group ${group}` }, { status: 400 })
    }
    stages = [...CRON_GROUPS[group]]
  }

  const limitParam = params.get('limit')
  const limit = limitParam ? Number(limitParam) : undefined
  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return Response.json({ error: 'limit must be a positive number' }, { status: 400 })
  }

  const symbols = params
    .get('symbols')
    ?.split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)

  const started = Date.now()

  const summaries = await runStages({
    stages,
    provider: params.get('provider') ?? undefined,
    symbols: symbols?.length ? symbols : undefined,
    limit,
    years: params.get('years') ? Number(params.get('years')) : undefined,
  })

  // Assess and alert in the same request. Waiting for the hourly watchdog would
  // delay the notification by up to an hour for a failure we already know about.
  const now = new Date()
  const report = assessHealth(await loadRuns(120), now)
  const alert = await alertOnHealth(report, now)

  const failed = summaries.some((s) => s.status === 'failed')

  return Response.json(
    {
      stages: summaries,
      durationMs: Date.now() - started,
      health: report.overall,
      alert,
    },
    {
      // Non-2xx on a failed stage so the platform's own cron log shows the
      // failure even if the alert channel is misconfigured.
      status: failed ? 500 : 200,
      headers: { 'cache-control': 'no-store' },
    },
  )
}
