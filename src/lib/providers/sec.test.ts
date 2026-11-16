import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { fiscalYearLabel, olderHistory, parseCompanyFacts, type CompanyFacts, type XbrlFact } from './sec'
import type { FinancialPeriod } from './types'

/* A fiscal year 2024-01-01 … 2024-12-31 with three 10-Qs and a 10-K. */

const Y = { start: '2024-01-01', end: '2024-12-31' }
const Q = [
  { start: '2024-01-01', end: '2024-03-31' },
  { start: '2024-04-01', end: '2024-06-30' },
  { start: '2024-07-01', end: '2024-09-30' },
]

function fact(start: string | undefined, end: string, val: number, form = '10-Q', filed = '2025-01-01'): XbrlFact {
  return { ...(start ? { start } : {}), end, val, form, filed }
}

function facts(tags: Record<string, { unit?: string; rows: XbrlFact[] }>): CompanyFacts {
  return {
    facts: {
      'us-gaap': Object.fromEntries(
        Object.entries(tags).map(([tag, { unit = 'USD', rows }]) => [tag, { units: { [unit]: rows } }]),
      ),
    },
  }
}

const base = {
  // Income statement: quarters filed as 3-month values, year on the 10-K.
  NetIncomeLoss: {
    rows: [
      fact(Q[0].start, Q[0].end, 10),
      fact(Q[1].start, Q[1].end, 20),
      fact(Q[2].start, Q[2].end, 30),
      fact(Y.start, Y.end, 100, '10-K'),
    ],
  },
  Revenues: {
    rows: [
      fact(Q[0].start, Q[0].end, 100),
      fact(Q[1].start, Q[1].end, 200),
      fact(Q[2].start, Q[2].end, 300),
      fact(Y.start, Y.end, 1000, '10-K'),
    ],
  },
  // Cash flow: 10-Qs report YEAR-TO-DATE only.
  NetCashProvidedByUsedInOperatingActivities: {
    rows: [
      fact(Y.start, Q[0].end, 15),
      fact(Y.start, Q[1].end, 40),
      fact(Y.start, Q[2].end, 70),
      fact(Y.start, Y.end, 120, '10-K'),
    ],
  },
  PaymentsToAcquirePropertyPlantAndEquipment: {
    rows: [fact(Y.start, Q[0].end, 5), fact(Y.start, Q[1].end, 10), fact(Y.start, Q[2].end, 15), fact(Y.start, Y.end, 20, '10-K')],
  },
  Assets: { rows: [fact(undefined, Q[2].end, 900), fact(undefined, Y.end, 1000, '10-K')] },
  EarningsPerShareDiluted: {
    unit: 'USD/shares',
    rows: [fact(Q[0].start, Q[0].end, 0.1), fact(Y.start, Y.end, 1.0, '10-K')],
  },
}

describe('parseCompanyFacts', () => {
  const { annual, quarterly } = parseCompanyFacts('TEST', facts(base))

  test('builds the fiscal year from the 10-K', () => {
    assert.equal(annual.length, 1)
    const fy = annual[0]
    assert.deepEqual([fy.period, fy.fiscalYear, fy.periodEnd], ['FY', 2024, '2024-12-31'])
    assert.equal(fy.revenue, 1000)
    assert.equal(fy.netIncome, 100)
    assert.equal(fy.totalAssets, 1000)
  })

  test('capex is stored negative and FCF = OCF + capex', () => {
    assert.equal(annual[0].capitalExpenditure, -20)
    assert.equal(annual[0].freeCashFlow, 100)
  })

  test('emits four quarters, newest first, labelled within the fiscal year', () => {
    assert.deepEqual(
      quarterly.map((q) => `${q.period} ${q.fiscalYear} ${q.periodEnd}`),
      ['Q4 2024 2024-12-31', 'Q3 2024 2024-09-30', 'Q2 2024 2024-06-30', 'Q1 2024 2024-03-31'],
    )
  })

  test('Q4 flows are the year minus the first three quarters', () => {
    assert.equal(quarterly[0].netIncome, 40) // 100 − 10 − 20 − 30
    assert.equal(quarterly[0].revenue, 400)
  })

  test('year-to-date cash flows are differenced into quarters', () => {
    const byQ = Object.fromEntries(quarterly.map((q) => [q.period, q.operatingCashFlow]))
    assert.deepEqual(byQ, { Q1: 15, Q2: 25, Q3: 30, Q4: 50 })
  })

  test('quarters sum exactly to the year for additive lines', () => {
    const total = quarterly.reduce((a, q) => a + (q.freeCashFlow ?? 0), 0)
    assert.equal(total, annual[0].freeCashFlow)
  })

  test('per-share values are never derived by subtraction', () => {
    const q1 = quarterly.find((q) => q.period === 'Q1')!
    assert.equal(q1.epsDiluted, 0.1)
    // No share counts filed → no basis for Q4 EPS, so it stays unknown.
    assert.equal(quarterly[0].epsDiluted, null)
  })

  test('Q4 shares come from the annual average; Q4 EPS from Q4 net income', () => {
    const tag = 'WeightedAverageNumberOfDilutedSharesOutstanding'
    const withShares = facts({
      ...base,
      [tag]: {
        unit: 'shares',
        rows: [
          fact(Q[0].start, Q[0].end, 100),
          fact(Q[1].start, Q[1].end, 100),
          fact(Q[2].start, Q[2].end, 100),
          fact(Y.start, Y.end, 97.5, '10-K'), // buybacks in Q4: 4 × 97.5 − 300 = 90
        ],
      },
    })
    const q4 = parseCompanyFacts('TEST', withShares).quarterly[0]
    assert.equal(q4.sharesDiluted, 90)
    assert.ok(Math.abs(q4.epsDiluted! - 40 / 90) < 1e-12)
  })

  test('balance-sheet lines are point-in-time at each quarter end', () => {
    assert.equal(quarterly.find((q) => q.period === 'Q3')!.totalAssets, 900)
    assert.equal(quarterly[0].totalAssets, 1000)
  })
})

describe('parseCompanyFacts — filing selection', () => {
  test('the original filing wins over later comparatives', () => {
    const f = facts({
      ...base,
      NetIncomeLoss: {
        rows: [
          ...base.NetIncomeLoss.rows,
          fact(Y.start, Y.end, 999, '10-K', '2026-02-01'), // next year's 10-K, restated
        ],
      },
    })
    assert.equal(parseCompanyFacts('TEST', f).annual[0].netIncome, 100)
  })

  test('ignores values from non-financial forms such as proxy statements', () => {
    const f = facts({
      ...base,
      NetIncomeLoss: {
        rows: [fact(Y.start, Y.end, 5, 'DEF 14A', '2024-06-01'), ...base.NetIncomeLoss.rows],
      },
    })
    assert.equal(parseCompanyFacts('TEST', f).annual[0].netIncome, 100)
  })

  test('a full-year duration filed on a 10-Q is not a fiscal year', () => {
    // Amazon files trailing-twelve-month cash flow in its 10-Qs.
    const f = facts({
      ...base,
      NetCashProvidedByUsedInOperatingActivities: {
        rows: [...base.NetCashProvidedByUsedInOperatingActivities.rows, fact('2023-07-01', '2024-06-30', 77)],
      },
    })
    assert.equal(parseCompanyFacts('TEST', f).annual.length, 1)
  })
})

describe('parseCompanyFacts — fiscal year in progress', () => {
  test('emits the 10-Q quarters filed since the last 10-K', () => {
    const f = facts({
      ...base,
      NetIncomeLoss: {
        rows: [...base.NetIncomeLoss.rows, fact('2025-01-01', '2025-03-31', 11), fact('2025-04-01', '2025-06-30', 22)],
      },
      NetCashProvidedByUsedInOperatingActivities: {
        rows: [
          ...base.NetCashProvidedByUsedInOperatingActivities.rows,
          fact('2025-01-01', '2025-03-31', 16),
          fact('2025-01-01', '2025-06-30', 41), // year-to-date
        ],
      },
    })
    const { annual, quarterly } = parseCompanyFacts('TEST', f)
    assert.equal(annual.length, 1) // no 10-K for 2025 yet
    assert.deepEqual(
      quarterly.slice(0, 2).map((q) => [q.period, q.fiscalYear, q.periodEnd, q.netIncome, q.operatingCashFlow]),
      [
        ['Q2', 2025, '2025-06-30', 22, 25],
        ['Q1', 2025, '2025-03-31', 11, 16],
      ],
    )
  })
})

describe('parseCompanyFacts — stock splits', () => {
  test('restates pre-split share counts and EPS onto the current basis', () => {
    const shares = 'WeightedAverageNumberOfDilutedSharesOutstanding'
    const f = facts({
      ...base,
      [shares]: {
        unit: 'shares',
        rows: [
          fact(Y.start, Y.end, 100, '10-K', '2025-02-01'),
          // A 10-for-1 split, then the next 10-K restates 2024 as a comparative.
          fact(Y.start, Y.end, 1000, '10-K', '2026-02-01'),
        ],
      },
      EarningsPerShareDiluted: {
        unit: 'USD/shares',
        rows: [fact(Y.start, Y.end, 1.0, '10-K', '2025-02-01')],
      },
    })
    const fy = parseCompanyFacts('TEST', f).annual[0]
    assert.equal(fy.sharesDiluted, 1000)
    assert.equal(fy.epsDiluted, 0.1)
  })
})

describe('fiscalYearLabel', () => {
  test('the calendar year the fiscal year ends in', () => {
    assert.equal(fiscalYearLabel('2026-09-26'), 2026)
    assert.equal(fiscalYearLabel('2026-01-25'), 2026) // NVIDIA FY2026
  })
  test('52/53-week years spilling into early January belong to the prior year', () => {
    assert.equal(fiscalYearLabel('2025-01-03'), 2024)
  })
})

describe('olderHistory', () => {
  const row = (periodEnd: string) => ({ periodEnd }) as FinancialPeriod

  test('drops periods the primary vendor already has, within 10 days', () => {
    const out = olderHistory([row('2024-12-31')], [row('2025-01-02'), row('2023-12-31')], 10)
    assert.deepEqual(out.map((r) => r.periodEnd), ['2023-12-31'])
  })

  test('caps the total at the limit, keeping the newest history', () => {
    const out = olderHistory(
      [row('2024-12-31')],
      [row('2020-12-31'), row('2023-12-31'), row('2022-12-31'), row('2021-12-31')],
      3,
    )
    assert.deepEqual(out.map((r) => r.periodEnd), ['2023-12-31', '2022-12-31'])
  })
})
