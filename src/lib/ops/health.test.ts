import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { assessHealth, assessStage, healthFingerprint, type RunRow } from './health'
import { ALERT_COOLDOWN_HOURS, formatAlert, shouldSend } from './alerts'
import { isAdminRole } from './access'
import { STAGE_POLICIES, STUCK_RUN_HOURS } from './policy'

const NOW = new Date('2026-06-15T12:00:00Z')
const HOUR = 3_600_000

function hoursAgo(h: number): Date {
  return new Date(NOW.getTime() - h * HOUR)
}

let nextId = 1

function run(over: Partial<RunRow> & { stage: string; status: string }): RunRow {
  const startedAt = over.startedAt ?? hoursAgo(1)
  return {
    id: nextId++,
    startedAt,
    finishedAt: over.status === 'running' ? null : (over.finishedAt ?? startedAt),
    itemsOk: 100,
    itemsFailed: 0,
    vendorCalls: 100,
    errors: null,
    ...over,
  }
}

/** Every stage fresh, so a test can break exactly one thing. */
function healthyRuns(): RunRow[] {
  return Object.keys(STAGE_POLICIES).map((stage) =>
    run({ stage, status: 'ok', startedAt: hoursAgo(2) }),
  )
}

describe('assessStage', () => {
  test('reports a stage that has never run', () => {
    const health = assessStage('quotes', [], NOW)
    assert.equal(health.state, 'never-run')
    assert.equal(health.healthy, false)
    assert.equal(health.ageHours, null)
  })

  test('is ok when the last run succeeded inside the freshness window', () => {
    const health = assessStage('quotes', [run({ stage: 'quotes', status: 'ok' })], NOW)
    assert.equal(health.state, 'ok')
    assert.equal(health.healthy, true)
  })

  test('is stale once the last success is older than the policy allows', () => {
    const limit = STAGE_POLICIES.quotes.stalenessHours
    const health = assessStage(
      'quotes',
      [run({ stage: 'quotes', status: 'ok', startedAt: hoursAgo(limit + 2) })],
      NOW,
    )
    assert.equal(health.state, 'stale')
    assert.equal(health.healthy, false)
  })

  test('counts a partial run as a success for freshness but still reports it', () => {
    // Some symbols fail every night — delistings, missing cash flow statements.
    // Treating that as an outage would page someone daily and bury real ones.
    const health = assessStage(
      'financials',
      [run({ stage: 'financials', status: 'partial', itemsFailed: 3 })],
      NOW,
    )
    assert.equal(health.state, 'partial')
    assert.equal(health.healthy, true)
    assert.equal(health.itemsFailed, 3)
  })

  test('a failed run outranks the age of an older success', () => {
    const health = assessStage(
      'quotes',
      [
        run({ stage: 'quotes', status: 'failed', startedAt: hoursAgo(1) }),
        run({ stage: 'quotes', status: 'ok', startedAt: hoursAgo(3) }),
      ],
      NOW,
    )
    assert.equal(health.state, 'failed')
  })

  test('a short in-flight run is not a problem', () => {
    const health = assessStage(
      'prices',
      [
        run({ stage: 'prices', status: 'running', startedAt: hoursAgo(0.2) }),
        run({ stage: 'prices', status: 'ok', startedAt: hoursAgo(24) }),
      ],
      NOW,
    )
    assert.equal(health.state, 'ok')
  })

  test('a run stuck in `running` is caught even though nothing marked it failed', () => {
    // A killed process never writes its own final status. Without this branch a
    // crashed run would sit in `running` and look like work in progress forever.
    const health = assessStage(
      'prices',
      [run({ stage: 'prices', status: 'running', startedAt: hoursAgo(STUCK_RUN_HOURS + 1) })],
      NOW,
    )
    assert.equal(health.state, 'stuck')
    assert.equal(health.healthy, false)
  })

  test('parses recorded per-symbol errors', () => {
    const health = assessStage(
      'financials',
      [
        run({
          stage: 'financials',
          status: 'partial',
          itemsFailed: 1,
          errors: [{ item: 'ZZZZ', message: 'no income statement' }],
        }),
      ],
      NOW,
    )
    assert.deepEqual(health.errors, [{ item: 'ZZZZ', message: 'no income statement' }])
  })
})

describe('assessHealth', () => {
  test('is ok when every stage is fresh', () => {
    const report = assessHealth(healthyRuns(), NOW)
    assert.equal(report.overall, 'ok')
    assert.deepEqual(report.problems, [])
  })

  test('a broken critical stage takes the whole report down', () => {
    const runs = healthyRuns().filter((r) => r.stage !== 'quotes')
    const report = assessHealth([...runs, run({ stage: 'quotes', status: 'failed' })], NOW)
    assert.equal(report.overall, 'down')
    assert.equal(report.problems[0].stage, 'quotes')
  })

  test('a stale warning-level stage only degrades', () => {
    const runs = healthyRuns().filter((r) => r.stage !== 'universe')
    const stale = run({
      stage: 'universe',
      status: 'ok',
      startedAt: hoursAgo(STAGE_POLICIES.universe.stalenessHours + 5),
    })
    const report = assessHealth([...runs, stale], NOW)
    assert.equal(report.overall, 'degraded')
    assert.equal(report.problems.length, 1)
  })

  test('orders problems critical first, worst state first', () => {
    const report = assessHealth(
      [
        run({ stage: 'universe', status: 'failed' }),
        run({ stage: 'quotes', status: 'ok', startedAt: hoursAgo(100) }),
        run({ stage: 'prices', status: 'failed' }),
        run({ stage: 'financials', status: 'ok' }),
        run({ stage: 'valuations', status: 'ok' }),
        run({ stage: 'profiles', status: 'ok' }),
      ],
      NOW,
    )
    assert.deepEqual(
      report.problems.map((p) => p.stage),
      ['prices', 'quotes', 'universe'],
    )
  })

  test('an empty table reports every stage as never run', () => {
    const report = assessHealth([], NOW)
    assert.equal(report.overall, 'down')
    assert.equal(report.problems.length, 6)
  })
})

describe('healthFingerprint', () => {
  test('is stable for the same problem set', () => {
    const runs = healthyRuns().filter((r) => r.stage !== 'quotes')
    const a = assessHealth([...runs, run({ stage: 'quotes', status: 'failed' })], NOW)
    const b = assessHealth([...runs, run({ stage: 'quotes', status: 'failed' })], NOW)
    assert.equal(healthFingerprint(a), healthFingerprint(b))
  })

  test('changes when a stage worsens, so the cooldown does not hide it', () => {
    const others = healthyRuns().filter((r) => r.stage !== 'quotes')
    const stale = assessHealth(
      [...others, run({ stage: 'quotes', status: 'ok', startedAt: hoursAgo(200) })],
      NOW,
    )
    const failed = assessHealth([...others, run({ stage: 'quotes', status: 'failed' })], NOW)
    assert.notEqual(healthFingerprint(stale), healthFingerprint(failed))
  })

  test('is "ok" when there is nothing wrong', () => {
    assert.equal(healthFingerprint(assessHealth(healthyRuns(), NOW)), 'ok')
  })
})

describe('shouldSend', () => {
  test('sends the first time', () => {
    assert.equal(shouldSend(null, NOW), true)
  })

  test('stays quiet inside the cooldown', () => {
    assert.equal(shouldSend(hoursAgo(1), NOW), false)
  })

  test('repeats once the cooldown has passed', () => {
    assert.equal(shouldSend(hoursAgo(ALERT_COOLDOWN_HOURS + 0.1), NOW), true)
  })
})

describe('formatAlert', () => {
  test('names the stage, its state and the user-visible impact', () => {
    const others = healthyRuns().filter((r) => r.stage !== 'quotes')
    const report = assessHealth(
      [
        ...others,
        run({
          stage: 'quotes',
          status: 'failed',
          errors: [{ item: 'AAPL', message: 'vendor 500' }],
        }),
      ],
      NOW,
    )

    const text = formatAlert(report, 'https://finlens.app')
    assert.match(text, /pipeline DOWN/)
    assert.match(text, /quotes — failed/)
    assert.match(text, /margin of safety/)
    assert.match(text, /AAPL: vendor 500/)
    assert.match(text, /https:\/\/finlens\.app\/ops/)
  })

  test('says so plainly on recovery', () => {
    const text = formatAlert(assessHealth(healthyRuns(), NOW))
    assert.match(text, /recovered/)
    assert.match(text, /All stages fresh again/)
  })
})

describe('isAdminRole', () => {
  test('grants only the literal admin role', () => {
    assert.equal(isAdminRole('admin'), true)
    assert.equal(isAdminRole('user'), false)
  })

  test('is closed for a missing or garbage role', () => {
    assert.equal(isAdminRole(null), false)
    assert.equal(isAdminRole(undefined), false)
    assert.equal(isAdminRole('Admin'), false)
    assert.equal(isAdminRole(''), false)
  })
})
