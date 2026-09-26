import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { SectionHeading } from '@/components/metric-card'
import { isAdminRole } from '@/lib/ops/access'
import type { StageHealth, StageState } from '@/lib/ops/health'
import { loadHealth } from '@/lib/ops/queries'

/**
 * Pipeline dashboard.
 *
 * The gate for this phase: a failed nightly run has to be visible without
 * reading logs. This page is that surface — per-stage freshness against the
 * policy, the last run of each stage, and the recent run log with the errors it
 * recorded.
 *
 * `notFound()` rather than a redirect for a non-admin: the existence of an
 * internal dashboard is not something to advertise to signed-in customers.
 */

export const metadata = { title: 'Pipeline | finlens' }
export const dynamic = 'force-dynamic'

const STATE_LABEL: Record<StageState, string> = {
  ok: 'ok',
  partial: 'partial',
  stale: 'stale',
  failed: 'failed',
  stuck: 'stuck',
  'never-run': 'never run',
}

const STATE_TONE: Record<StageState, string> = {
  ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  partial: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  stale: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-400',
  stuck: 'bg-red-500/10 text-red-700 dark:text-red-400',
  'never-run': 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
}

function age(stage: StageHealth): string {
  if (stage.ageHours === null) return 'never'
  if (stage.ageHours < 1) return `${Math.round(stage.ageHours * 60)}m ago`
  if (stage.ageHours < 48) return `${stage.ageHours.toFixed(1)}h ago`
  return `${Math.floor(stage.ageHours / 24)}d ago`
}

function stamp(value: Date | null | undefined): string {
  if (!value) return '—'
  return value.toISOString().replace('T', ' ').slice(0, 16)
}

export default async function OpsPage() {
  const session = await auth()
  if (!isAdminRole(session?.user?.role)) notFound()

  const { report, runs } = await loadHealth()

  const overallTone =
    report.overall === 'ok'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : report.overall === 'degraded'
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
        : 'bg-red-500/10 text-red-700 dark:text-red-400'

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Pipeline"
        subtitle="Stage freshness, run history and recorded failures. Refreshed on load."
      />

      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${overallTone}`}>
          {report.overall}
        </span>
        <span className="text-xs text-zinc-500">
          checked {stamp(report.checkedAt)}Z · {report.problems.length} stage
          {report.problems.length === 1 ? '' : 's'} needing attention
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-2">Stage</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Last success</th>
              <th className="px-4 py-2">Limit</th>
              <th className="px-4 py-2">Cadence</th>
              <th className="px-4 py-2 text-right">ok / failed</th>
            </tr>
          </thead>
          <tbody>
            {report.stages.map((stage) => (
              <tr key={stage.stage} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <td className="px-4 py-2 font-medium">{stage.stage}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATE_TONE[stage.state]}`}>
                    {STATE_LABEL[stage.state]}
                  </span>
                  {stage.severity === 'critical' && !stage.healthy && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">critical</span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-500">{age(stage)}</td>
                <td className="px-4 py-2 text-zinc-500">{stage.stalenessHours}h</td>
                <td className="px-4 py-2 text-zinc-500">{stage.cadence}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {stage.itemsOk} / {stage.itemsFailed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report.problems.length > 0 && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-500/5 p-4 dark:border-red-900">
          <h2 className="text-sm font-semibold">What is broken and what it costs users</h2>
          <ul className="space-y-2 text-sm">
            {report.problems.map((stage) => (
              <li key={stage.stage}>
                <span className="font-medium">{stage.stage}</span> — {STATE_LABEL[stage.state]}:{' '}
                {stage.impact}
                {stage.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-4 text-xs text-zinc-500">
                    {stage.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="font-mono">
                        {e.item}: {e.message}
                      </li>
                    ))}
                    {stage.errors.length > 5 && (
                      <li>…and {stage.errors.length - 5} more on the run row</li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Recent runs</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">ok</th>
                <th className="px-4 py-2 text-right">failed</th>
                <th className="px-4 py-2 text-right">vendor calls</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 30).map((run) => (
                <tr key={run.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-2 text-zinc-500">{stamp(run.startedAt)}Z</td>
                  <td className="px-4 py-2">{run.stage}</td>
                  <td className="px-4 py-2">{run.status}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{run.itemsOk}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{run.itemsFailed}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{run.vendorCalls}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-zinc-500" colSpan={6}>
                    No runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
