import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  cagrOverYears,
  deriveMetrics,
  liquidCash,
  priceReturns,
  priceToEarnings,
  returnOnInvestedCapital,
  trailingTwelveMonths,
  type QuarterRow,
  type StatementLike,
} from './metrics'

function quarter(periodEnd: string, over: Partial<QuarterRow> = {}): QuarterRow {
  return {
    periodEnd,
    revenue: 100,
    grossProfit: 40,
    operatingIncome: 30,
    ebitda: 35,
    interestExpense: 2,
    netIncome: 20,
    incomeTax: 5,
    eps: 1,
    epsDiluted: 0.9,
    operatingCashFlow: 25,
    capitalExpenditure: -5,
    freeCashFlow: 20,
    sharesDiluted: 22,
    totalAssets: 1000,
    totalEquity: 400,
    totalDebt: 300,
    totalCurrentAssets: 500,
    totalCurrentLiabilities: 250,
    cashAndEquivalents: 50,
    shortTermInvestments: 25,
    ...over,
  }
}

const FOUR = ['2026-09-30', '2026-06-30', '2026-03-31', '2025-12-31']

describe('trailingTwelveMonths', () => {
  test('accepts retail calendars with a 16-week fourth quarter', () => {
    // Costco: three 12-week quarters and a 16-week Q4.
    const rows = ['2025-08-31', '2025-05-11', '2025-02-16', '2024-11-24'].map((d) => quarter(d))
    assert.notEqual(trailingTwelveMonths(rows), null)
  })

  test('sums flows over four consecutive quarters and takes balances from the newest', () => {
    const rows = FOUR.map((d, i) => quarter(d, { revenue: 100 + i, totalAssets: 1000 - i }))
    const ttm = trailingTwelveMonths(rows)
    assert.ok(ttm)
    assert.equal(ttm.revenue, 100 + 101 + 102 + 103)
    assert.equal(ttm.epsDiluted, 3.6)
    assert.equal(ttm.capitalExpenditure, -20)
    assert.equal(ttm.totalAssets, 1000) // newest quarter, not a sum
    assert.equal(ttm.periodEnd, '2026-09-30')
  })

  test('null with fewer than four quarters', () => {
    assert.equal(trailingTwelveMonths(FOUR.slice(0, 3).map((d) => quarter(d))), null)
  })

  test('null when a quarter is missing between rows', () => {
    const gap = ['2026-09-30', '2026-06-30', '2025-12-31', '2025-09-30'].map((d) => quarter(d))
    assert.equal(trailingTwelveMonths(gap), null)
  })

  test('a flow line is null unless all four quarters report it', () => {
    const rows = FOUR.map((d, i) => quarter(d, i === 2 ? { ebitda: null } : {}))
    const ttm = trailingTwelveMonths(rows)
    assert.ok(ttm)
    assert.equal(ttm.ebitda, null)
    assert.equal(ttm.revenue, 400)
  })

  test('uses only the newest four of a longer series', () => {
    const rows = [...FOUR, '2025-09-30'].map((d) => quarter(d))
    rows[4].revenue = 999_999
    assert.equal(trailingTwelveMonths(rows)?.revenue, 400)
  })
})

describe('liquidCash', () => {
  test('adds short-term investments to cash', () => {
    assert.equal(liquidCash(50, 25), 75)
  })
  test('treats one missing side as zero, both missing as unknown', () => {
    assert.equal(liquidCash(50, null), 50)
    assert.equal(liquidCash(null, null), null)
  })
})

function statement(over: Partial<StatementLike> = {}): StatementLike {
  return {
    revenue: 1000,
    grossProfit: 400,
    operatingIncome: 300,
    ebitda: 350,
    netIncome: 200,
    incomeTax: 50,
    totalAssets: 2000,
    totalEquity: 800,
    totalDebt: 400,
    totalCurrentAssets: 600,
    totalCurrentLiabilities: 300,
    operatingCashFlow: 250,
    freeCashFlow: 220,
    sharesDiluted: 100,
    ...over,
  }
}

describe('returnOnInvestedCapital', () => {
  test('NOPAT over debt + equity − cash', () => {
    // tax rate 50 / 250 = 20% → NOPAT 240; invested 400 + 800 − 200 = 1000
    assert.equal(returnOnInvestedCapital(statement(), 200), 0.24)
  })
  test('null without a tax line instead of assuming a rate', () => {
    assert.equal(returnOnInvestedCapital(statement({ incomeTax: null }), 0), null)
  })
  test('null when invested capital is not positive', () => {
    assert.equal(returnOnInvestedCapital(statement(), 5000), null)
  })
  test('null on a pre-tax loss', () => {
    assert.equal(returnOnInvestedCapital(statement({ netIncome: -100, incomeTax: 10 }), 0), null)
  })
})

describe('deriveMetrics net debt', () => {
  test('uses the cash figure it is given', () => {
    assert.equal(deriveMetrics(statement(), 150).netDebt, 250)
  })
})

describe('priceToEarnings', () => {
  test('price over diluted EPS', () => {
    assert.equal(priceToEarnings(100, 4), 25)
  })
  test('null on losses or missing inputs', () => {
    assert.equal(priceToEarnings(100, -2), null)
    assert.equal(priceToEarnings(100, 0), null)
    assert.equal(priceToEarnings(null, 4), null)
  })
})

describe('cagrOverYears', () => {
  test('reports the span actually measured', () => {
    const rows = [2025, 2024, 2023, 2022, 2021].map((fiscalYear, i) => ({
      fiscalYear,
      value: 100 / 1.1 ** i,
    }))
    const r = cagrOverYears(rows, 5)
    assert.equal(r.years, 4) // five rows are four growth periods, not five
    assert.ok(Math.abs((r.value ?? 0) - 0.1) < 1e-9)
  })

  test('caps the window at maxYears', () => {
    const rows = [2025, 2024, 2023, 2022, 2021, 2020, 2019].map((fiscalYear) => ({
      fiscalYear,
      value: 10,
    }))
    assert.equal(cagrOverYears(rows, 5).years, 5)
  })

  test('skips missing values without miscounting years', () => {
    const r = cagrOverYears(
      [
        { fiscalYear: 2025, value: 121 },
        { fiscalYear: 2024, value: null },
        { fiscalYear: 2023, value: 100 },
      ],
      5,
    )
    assert.equal(r.years, 2)
    assert.ok(Math.abs((r.value ?? 0) - 0.1) < 1e-9)
  })

  test('null across a sign change', () => {
    const r = cagrOverYears(
      [
        { fiscalYear: 2025, value: 50 },
        { fiscalYear: 2022, value: -10 },
      ],
      5,
    )
    assert.equal(r.value, null)
  })
})

describe('priceReturns', () => {
  const bars = [
    { tradeDate: '2021-11-10', close: 50 },
    { tradeDate: '2021-11-11', close: 40 },
    { tradeDate: '2025-11-11', close: 80 },
    { tradeDate: '2025-12-31', close: 100 },
    { tradeDate: '2026-11-11', close: 160 },
  ]

  test('YTD from the last close of the previous year', () => {
    assert.ok(Math.abs((priceReturns(bars).ytd ?? 0) - 0.6) < 1e-12)
  })

  test('one and five years back use the close on or before that date', () => {
    const r = priceReturns(bars)
    assert.equal(r.oneYear, 1) // 80 → 160
    assert.equal(r.fiveYear, 3) // 40 → 160
    assert.ok(Math.abs((r.fiveYearCagr ?? 0) - (4 ** 0.2 - 1)) < 1e-12)
  })

  test('null when history does not reach the start date', () => {
    const r = priceReturns(bars.slice(2))
    assert.equal(r.fiveYear, null)
    assert.equal(r.fiveYearCagr, null)
    assert.equal(r.oneYear, 1)
  })

  test('empty series', () => {
    assert.equal(priceReturns([]).asOf, null)
  })
})
