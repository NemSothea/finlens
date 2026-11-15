import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFundamentalSeries,
  downsample,
  rollingTtm,
  withinYears,
  type StatementSeriesRow,
} from './fundamentals'

function row(period: string, fiscalYear: number, periodEnd: string, revenue: number): StatementSeriesRow {
  return {
    period,
    fiscalYear,
    periodEnd,
    revenue,
    grossProfit: revenue / 2,
    operatingIncome: revenue / 4,
    ebitda: revenue / 3,
    netIncome: revenue / 5,
    incomeTax: 1,
    eps: 1,
    epsDiluted: 1,
    operatingCashFlow: revenue / 4,
    capitalExpenditure: -1,
    freeCashFlow: revenue / 5,
    sharesDiluted: 10,
    totalAssets: 100,
    totalEquity: 50,
    totalDebt: 20,
    totalCurrentAssets: 40,
    totalCurrentLiabilities: 30,
    cashAndEquivalents: 10,
    shortTermInvestments: 5,
  }
}

// Newest first, five consecutive quarters.
const QUARTERS = [
  row('Q1', 2027, '2026-09-30', 50),
  row('Q4', 2026, '2026-06-30', 40),
  row('Q3', 2026, '2026-03-31', 30),
  row('Q2', 2026, '2025-12-31', 20),
  row('Q1', 2026, '2025-09-30', 10),
]

describe('rollingTtm', () => {
  test('one point per window of four consecutive quarters, oldest first', () => {
    const ttm = rollingTtm(QUARTERS)
    assert.deepEqual(
      ttm.map((p) => [p.label, p.revenue]),
      [
        ['TTM 2026-06', 100],
        ['TTM 2026-09', 140],
      ],
    )
  })

  test('empty with fewer than four quarters', () => {
    assert.equal(rollingTtm(QUARTERS.slice(0, 3)).length, 0)
  })
})

describe('buildFundamentalSeries', () => {
  test('ascending series with fiscal labels and net margin', () => {
    const s = buildFundamentalSeries(
      [row('FY', 2026, '2026-06-30', 400), row('FY', 2025, '2025-06-30', 300)],
      QUARTERS,
    )
    assert.deepEqual(s.annual.map((p) => p.label), ['FY2025', 'FY2026'])
    assert.equal(s.quarterly[0].label, 'Q1 FY26')
    assert.equal(s.quarterly.at(-1)?.label, 'Q1 FY27')
    assert.equal(s.annual[1].netMargin, 0.2)
    assert.equal(s.ttm.length, 2)
  })
})

describe('withinYears', () => {
  const pts = ['2021-06-30', '2023-06-30', '2025-06-30', '2026-06-30'].map((periodEnd) => ({ periodEnd }))

  test('keeps points inside the window measured from the newest', () => {
    assert.deepEqual(withinYears(pts, 1).map((p) => p.periodEnd), ['2026-06-30'])
    assert.deepEqual(withinYears(pts, 5).map((p) => p.periodEnd), ['2023-06-30', '2025-06-30', '2026-06-30'])
  })

  test('null keeps everything', () => {
    assert.equal(withinYears(pts, null).length, 4)
  })

  test('works on price bars keyed by tradeDate', () => {
    const bars = [{ tradeDate: '2025-01-02' }, { tradeDate: '2026-01-05' }]
    assert.equal(withinYears(bars, 1).length, 1)
  })
})

describe('downsample', () => {
  test('caps the length and keeps the newest point', () => {
    const xs = Array.from({ length: 1001 }, (_, i) => i)
    const out = downsample(xs, 100)
    assert.ok(out.length <= 102)
    assert.equal(out.at(-1), 1000)
    assert.equal(out[0], 0)
  })

  test('short series untouched', () => {
    assert.deepEqual(downsample([1, 2, 3], 10), [1, 2, 3])
  })
})
