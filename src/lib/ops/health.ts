import {
  STAGE_ORDER,
  STAGE_POLICIES,
  STUCK_RUN_HOURS,
  type Severity,
  type StageName,
} from './policy'

/**
 * Pipeline health, derived from `ingest_runs`.
 *
 * The assessment is a pure function over rows so every state — never run, stuck
 * mid-run, partially failed, stale — is unit-testable without a database. The
 * DB touch is one query in `loadHealth`.
 */

export interface RunRow {
  id: string
  stage: string
  status: string
  startedAt: Date
  finishedAt: Date | null
  itemsOk: number
  itemsFailed: number
  vendorCalls: number
  errors: unknown
}

export type StageState = 'ok' | 'partial' | 'stale' | 'failed' | 'stuck' | 'never-run'

export interface StageHealth {
  stage: StageName
  state: StageState
  severity: Severity
  cadence: string
  impact: string
  /** Whether this state is something a human has to act on. */
  healthy: boolean
  lastRun: RunRow | null
  lastSuccessAt: Date | null
  /** Hours since the last successful run. Null when there has never been one. */
  ageHours: number | null
  stalenessHours: number
  itemsOk: number
  itemsFailed: number
  errors: Array<{ item: string; message: string }>
}

export type OverallState = 'ok' | 'degraded' | 'down'

export interface HealthReport {
  overall: OverallState
  checkedAt: Date
  stages: StageHealth[]
  /** Only the stages needing attention, worst first. Alerts render from this. */
  problems: StageHealth[]
}

const HOUR = 3_600_000

function hoursSince(then: Date, now: Date): number {
  return (now.getTime() - then.getTime()) / HOUR
}

function parseErrors(value: unknown): Array<{ item: string; message: string }> {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const e = entry as { item?: unknown; message?: unknown }
    return [{ item: String(e.item ?? '?'), message: String(e.message ?? '') }]
  })
}

/**
 * Rank used for ordering problems and for choosing the overall verdict. A
 * hard failure outranks staleness: both need attention, but only one of them
 * means the last attempt actually broke.
 */
const STATE_RANK: Record<StageState, number> = {
  failed: 5,
  stuck: 4,
  'never-run': 3,
  stale: 2,
  partial: 1,
  ok: 0,
}

export function assessStage(stage: StageName, runs: RunRow[], now: Date): StageHealth {
  const policy = STAGE_POLICIES[stage]
  const mine = runs
    .filter((r) => r.stage === stage)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

  const lastRun = mine[0] ?? null
  // 'partial' still wrote data for most symbols, so it counts as a success for
  // staleness. Treating it as a failure would page someone every night for two
  // delisted tickers, and real outages would then be lost in the noise.
  const lastSuccess = mine.find((r) => r.status === 'ok' || r.status === 'partial') ?? null
  const lastSuccessAt = lastSuccess?.finishedAt ?? lastSuccess?.startedAt ?? null
  const ageHours = lastSuccessAt ? hoursSince(lastSuccessAt, now) : null

  const state: StageState = (() => {
    if (!lastRun) return 'never-run'

    if (lastRun.status === 'running') {
      // Only a run that has been going too long is a problem; a short one is
      // just the pipeline working right now.
      if (hoursSince(lastRun.startedAt, now) > STUCK_RUN_HOURS) return 'stuck'
      return ageHours !== null && ageHours > policy.stalenessHours ? 'stale' : 'ok'
    }

    if (lastRun.status === 'failed') return 'failed'
    if (ageHours === null) return 'never-run'
    if (ageHours > policy.stalenessHours) return 'stale'
    if (lastRun.status === 'partial') return 'partial'
    return 'ok'
  })()

  return {
    stage,
    state,
    severity: policy.severity,
    cadence: policy.cadence,
    impact: policy.impact,
    // 'partial' is reported but does not count as unhealthy — see above.
    healthy: state === 'ok' || state === 'partial',
    lastRun,
    lastSuccessAt,
    ageHours,
    stalenessHours: policy.stalenessHours,
    itemsOk: lastRun?.itemsOk ?? 0,
    itemsFailed: lastRun?.itemsFailed ?? 0,
    errors: parseErrors(lastRun?.errors),
  }
}

export function assessHealth(runs: RunRow[], now: Date): HealthReport {
  const stages = STAGE_ORDER.map((stage) => assessStage(stage, runs, now))
  const problems = stages
    .filter((s) => !s.healthy)
    .sort((a, b) => {
      // Critical stages first, then by how bad the state is.
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1
      return STATE_RANK[b.state] - STATE_RANK[a.state]
    })

  // Fail loud: a broken critical stage means the numbers on the page are wrong,
  // which is worse for a research product than being offline.
  const overall: OverallState = problems.some((s) => s.severity === 'critical')
    ? 'down'
    : problems.length > 0
      ? 'degraded'
      : 'ok'

  return { overall, checkedAt: now, stages, problems }
}

/**
 * One fingerprint per distinct problem set, used to suppress repeat alerts.
 * Includes the state so a stage sliding from `stale` to `failed` re-alerts
 * instead of being swallowed by the cooldown.
 */
export function healthFingerprint(report: HealthReport): string {
  if (report.problems.length === 0) return 'ok'
  return report.problems.map((s) => `${s.stage}:${s.state}`).join(',')
}
