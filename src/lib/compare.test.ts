import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { alignByCalendar, calendarBucket, indexPrices, pickWinner } from './compare'
import type { FundamentalPoint } from './fundamentals'

describe('pickWinner', () => {
  test('higher is better', () => {
    assert.equal(pickWinner([0.2, 0.5, 0.1], 'higher'), 1)
  })
  test('lower is better', () => {
    assert.equal(pickWinner([25, 18, 40], 'lower'), 1)
  })
  test('ignores missing values', () => {
    assert.equal(pickWinner([null, 0.3, 0.4], 'higher'), 2)
  })
  test('null with fewer than two known values', () => {
    assert.equal(pickWinner([null, 0.3], 'higher'), null)
  })
  test('null on a tie at the top', () => {
    assert.equal(pickWinner([0.3, 0.3, 0.1], 'higher'), null)
  })
})

describe('calendarBucket', () => {
  test('a fiscal year goes to the calendar year holding its midpoint', () => {
    assert.equal(calendarBucket('2026-01-25', 'year'), 'CY2025') // NVDA FY2026
    assert.equal(calendarBucket('2026-09-26', 'year'), 'CY2026') // AAPL FY2026
    assert.equal(calendarBucket('2026-12-31', 'year'), 'CY2026')
  })
  test('a fiscal quarter goes to the calendar quarter holding its midpoint', () => {
    assert.equal(calendarBucket('2026-07-26', 'quarter'), '2026 Q2') // NVDA Q2 FY27
    assert.equal(calendarBucket('2026-09-26', 'quarter'), '2026 Q3') // AAPL Q4 FY26
    assert.equal(calendarBucket('2026-09-30', 'quarter'), '2026 Q3') // MSFT Q1 FY27
    assert.equal(calendarBucket('2026-03-31', 'quarter'), '2026 Q1')
  })
})

function pt(periodEnd: string, revenue: number | null): FundamentalPoint {
  return {
    label: periodEnd,
    periodEnd,
    revenue,
    ebitda: null,
    netIncome: null,
    epsDiluted: null,
    operatingCashFlow: null,
    freeCashFlow: null,
    netMargin: null,
  }
}

describe('alignByCalendar', () => {
  test('puts different fiscal calendars on shared buckets, with gaps as null', () => {
    const rows = alignByCalendar(
      [
        { symbol: 'AAPL', points: [pt('2025-09-27', 400), pt('2026-09-26', 480)] },
        { symbol: 'NVDA', points: [pt('2026-01-25', 216)] },
      ],
      'revenue',
      'year',
    )
    assert.deepEqual(rows, [
      { x: 'CY2025', AAPL: 400, NVDA: 216 },
      { x: 'CY2026', AAPL: 480, NVDA: null },
    ])
  })
})

describe('indexPrices', () => {
  test('rebases each company to 100 on the first shared date', () => {
    const rows = indexPrices([
      { symbol: 'A', bars: [{ tradeDate: '2026-01-01', close: 50 }, { tradeDate: '2026-01-02', close: 75 }] },
      {
        symbol: 'B',
        bars: [
          { tradeDate: '2025-12-31', close: 1 },
          { tradeDate: '2026-01-01', close: 200 },
          { tradeDate: '2026-01-02', close: 100 },
        ],
      },
    ])
    assert.deepEqual(rows, [
      { tradeDate: '2026-01-01', A: 100, B: 100 },
      { tradeDate: '2026-01-02', A: 150, B: 50 },
    ])
  })

  test('empty when there is no shared date', () => {
    assert.deepEqual(
      indexPrices([
        { symbol: 'A', bars: [{ tradeDate: '2026-01-01', close: 1 }] },
        { symbol: 'B', bars: [{ tradeDate: '2026-01-02', close: 1 }] },
      ]),
      [],
    )
  })
})
