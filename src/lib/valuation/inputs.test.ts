import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { deriveDcfInputs, type StatementInput } from './inputs'

function statement(over: Partial<StatementInput> = {}): StatementInput {
  return {
    freeCashFlow: 100,
    totalDebt: 500,
    cashAndEquivalents: 200,
    sharesDiluted: 1_000,
    ...over,
  }
}

describe('deriveDcfInputs', () => {
  test('averages free cash flow over three years', () => {
    const result = deriveDcfInputs(
      [
        statement({ freeCashFlow: 300 }),
        statement({ freeCashFlow: 200 }),
        statement({ freeCashFlow: 100 }),
        statement({ freeCashFlow: 999 }), // outside the window
      ],
      { price: 10, sharesOutstanding: 1_000 },
    )

    assert.ok(result.ok)
    assert.equal(result.inputs.baseFreeCashFlow, 200)
    assert.equal(result.inputs.fcfYearsUsed, 3)
  })

  test('net debt is total debt minus cash, from the newest statement', () => {
    const result = deriveDcfInputs(
      [statement({ totalDebt: 500, cashAndEquivalents: 200 })],
      { price: 10, sharesOutstanding: 1_000 },
    )

    assert.ok(result.ok)
    assert.equal(result.inputs.netDebt, 300)
  })

  test('net cash produces a negative net debt', () => {
    const result = deriveDcfInputs(
      [statement({ totalDebt: 100, cashAndEquivalents: 900 })],
      { price: 10, sharesOutstanding: 1_000 },
    )

    assert.ok(result.ok)
    assert.equal(result.inputs.netDebt, -800)
  })

  test('counts short-term investments as cash in net debt', () => {
    const result = deriveDcfInputs(
      [statement({ totalDebt: 500, cashAndEquivalents: 200, shortTermInvestments: 150 })],
      { price: 10, sharesOutstanding: 1_000 },
    )
    assert.ok(result.ok)
    assert.equal(result.inputs.netDebt, 150)
  })

  test('prefers the live quote share count over the statement figure', () => {
    // The statement count is as of fiscal year end and misses later buybacks.
    // Three statements so the FCF-history warning does not fire and obscure
    // what this test is actually asserting.
    const result = deriveDcfInputs(
      [
        statement({ sharesDiluted: 1_000 }),
        statement({ sharesDiluted: 1_000 }),
        statement({ sharesDiluted: 1_000 }),
      ],
      { price: 10, sharesOutstanding: 900 },
      { beta: 1 },
    )

    assert.ok(result.ok)
    assert.equal(result.inputs.sharesOutstanding, 900)
    assert.equal(result.inputs.warnings.length, 0)
  })

  test('falls back to the statement share count and warns', () => {
    const result = deriveDcfInputs([statement({ sharesDiluted: 1_000 })], {
      price: 10,
      sharesOutstanding: null,
    })

    assert.ok(result.ok)
    assert.equal(result.inputs.sharesOutstanding, 1_000)
    assert.ok(result.inputs.warnings.some((w) => w.includes('stale')))
  })

  test('warns when fewer than three years of cash flow are available', () => {
    const result = deriveDcfInputs([statement({ freeCashFlow: 100 })], {
      price: 10,
      sharesOutstanding: 1_000,
    })

    assert.ok(result.ok)
    assert.equal(result.inputs.fcfYearsUsed, 1)
    assert.ok(result.inputs.warnings.some((w) => w.includes('noisier')))
  })

  test('skips null cash flow years rather than treating them as zero', () => {
    const result = deriveDcfInputs(
      [
        statement({ freeCashFlow: 300 }),
        statement({ freeCashFlow: null }),
        statement({ freeCashFlow: 100 }),
      ],
      { price: 10, sharesOutstanding: 1_000 },
    )

    assert.ok(result.ok)
    // (300 + 100) / 2, not (300 + 0 + 100) / 3.
    assert.equal(result.inputs.baseFreeCashFlow, 200)
  })

  test('warns but still returns a result for negative cash flow', () => {
    const result = deriveDcfInputs([statement({ freeCashFlow: -50 })], {
      price: 10,
      sharesOutstanding: 1_000,
    })

    assert.ok(result.ok)
    assert.ok(result.inputs.warnings.some((w) => w.includes('negative')))
  })

  test('fails with a typed reason when no cash flow exists at all', () => {
    const result = deriveDcfInputs([statement({ freeCashFlow: null })], {
      price: 10,
      sharesOutstanding: 1_000,
    })

    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.reason, 'no-free-cash-flow')
  })

  test('fails with a typed reason when no share count exists anywhere', () => {
    const result = deriveDcfInputs([statement({ sharesDiluted: null })], {
      price: 10,
      sharesOutstanding: null,
    })

    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.reason, 'no-share-count')
  })

  test('rejects a zero share count rather than dividing by it', () => {
    const result = deriveDcfInputs([statement({ sharesDiluted: 0 })], {
      price: 10,
      sharesOutstanding: 0,
    })

    assert.equal(result.ok, false)
    assert.equal(result.ok === false && result.reason, 'no-share-count')
  })

  test('handles a missing quote entirely', () => {
    const result = deriveDcfInputs([statement()], null)
    assert.ok(result.ok)
    assert.equal(result.inputs.sharesOutstanding, 1_000)
  })

  test('produces assumptions that feed calculateDcf directly', () => {
    const result = deriveDcfInputs([statement()], { price: 10, sharesOutstanding: 1_000 })
    assert.ok(result.ok)

    const a = result.inputs.assumptions
    assert.equal(a.baseFreeCashFlow, result.inputs.baseFreeCashFlow)
    assert.equal(a.sharesOutstanding, result.inputs.sharesOutstanding)
    assert.equal(a.netDebt, result.inputs.netDebt)
    assert.ok(a.discountRate > a.terminalGrowthRate)
  })
})

/* ------------------------------------------------------------------ */

import { assumptionsFor } from './inputs'
import type { QuarterRow } from '@/lib/metrics'

function quarter(periodEnd: string, over: Partial<QuarterRow> = {}): QuarterRow {
  return {
    periodEnd,
    revenue: 100, grossProfit: 50, operatingIncome: 30, ebitda: 35,
    interestExpense: 5, netIncome: 20, incomeTax: 5, eps: 1, epsDiluted: 1,
    operatingCashFlow: 40, capitalExpenditure: -10, freeCashFlow: 30,
    sharesDiluted: 1_000, totalAssets: 1_000, totalEquity: 500, totalDebt: 600,
    totalCurrentAssets: 300, totalCurrentLiabilities: 200,
    cashAndEquivalents: 100, shortTermInvestments: 50,
    ...over,
  }
}

// Five consecutive quarters, newest first; debt grew 400 → 600 over the year.
const QUARTERS = [
  quarter('2026-09-30'),
  quarter('2026-06-30'),
  quarter('2026-03-31'),
  quarter('2025-12-31'),
  quarter('2025-09-30', { totalDebt: 400 }),
]

const annual = [
  statement({ periodEnd: '2025-12-31', freeCashFlow: 90, interestExpense: 16, incomeTax: 20, netIncome: 80, totalDebt: 500 }),
  statement({ periodEnd: '2024-12-31', freeCashFlow: 90, interestExpense: 16, incomeTax: 20, netIncome: 80, totalDebt: 400 }),
  statement({ periodEnd: '2023-12-31', freeCashFlow: 90, interestExpense: 16, incomeTax: 20, netIncome: 80, totalDebt: 300 }),
  statement({ periodEnd: '2022-12-31', freeCashFlow: 90, totalDebt: 200 }),
]

describe('deriveDcfInputs — bases, flavours, WACC', () => {
  const derive = () => {
    const r = deriveDcfInputs(annual, { price: 10, sharesOutstanding: 1_000, marketCap: 10_000 }, {
      quarters: QUARTERS,
      beta: 1,
    })
    assert.ok(r.ok)
    return r.inputs
  }

  test('TTM base sums four quarters and is the default when fresh', () => {
    const i = derive()
    assert.equal(i.defaults.basis, 'ttm')
    assert.equal(i.bases.ttm?.freeCashFlow, 120)
    assert.equal(i.bases.ttm?.label, 'TTM to 2026-09-30')
  })

  test('FCFF adds back after-tax interest; tax is the effective rate', () => {
    const i = derive()
    // TTM interest 20, tax 20 / (80 + 20) = 20% → 16 after tax.
    assert.equal(i.bases.ttm?.afterTaxInterest, 16)
    assert.equal(i.assumptions.baseFreeCashFlow, 136)
    assert.equal(i.baseFreeCashFlow, 136)
  })

  test('net debt and WACC use the newest quarter balance sheet', () => {
    const i = derive()
    assert.equal(i.netDebt, 600 - 150)
    assert.ok(i.wacc)
    assert.equal(i.assumptions.discountRate, Math.round(i.wacc.wacc * 10_000) / 10_000)
  })

  test('FCFE adds the year-over-year debt change, discounts at cost of equity, no net debt', () => {
    const i = derive()
    const a = assumptionsFor(i, { basis: 'ttm', flavour: 'fcfe' })
    assert.ok(a)
    assert.equal(a.baseFreeCashFlow, 120 + 200)
    assert.equal(a.netDebt, 0)
    assert.equal(a.discountRate, Math.round(i.wacc!.costOfEquity * 10_000) / 10_000)
  })

  test('average basis annualises net borrowing over the averaged years', () => {
    const i = derive()
    assert.equal(i.bases.average?.freeCashFlow, 90)
    // (500 − 200) / 3 years
    assert.equal(i.bases.average?.netBorrowing, 100)
    assert.ok(Math.abs(i.bases.average!.afterTaxInterest! - 12.8) < 1e-9)
  })

  test('stale quarters do not override a newer annual report', () => {
    const late = [statement({ periodEnd: '2027-03-31', freeCashFlow: 90 }), ...annual]
    const r = deriveDcfInputs(late, { price: 10, sharesOutstanding: 1_000 }, { quarters: QUARTERS, beta: 1 })
    assert.ok(r.ok)
    assert.equal(r.inputs.bases.ttm, null)
    assert.equal(r.inputs.defaults.basis, 'average')
  })

  test('FCFE is unavailable without a year of debt history', () => {
    const i = derive()
    const r = deriveDcfInputs(annual.slice(0, 1), { price: 10, sharesOutstanding: 1_000 }, {
      quarters: QUARTERS.slice(0, 4),
      beta: 1,
    })
    assert.ok(r.ok)
    assert.equal(assumptionsFor(r.inputs, { basis: 'ttm', flavour: 'fcfe' }), null)
    assert.equal(assumptionsFor(r.inputs, { basis: 'average', flavour: 'fcfe' }), null)
    assert.ok(assumptionsFor(i, { basis: 'average', flavour: 'fcfe' }))
  })

  test('zero interest is treated as not reported, not as no interest', () => {
    const q = QUARTERS.map((r) => ({ ...r, interestExpense: 0 }))
    const r = deriveDcfInputs(annual, { price: 10, sharesOutstanding: 1_000 }, { quarters: q, beta: 1 })
    assert.ok(r.ok)
    assert.equal(r.inputs.bases.ttm?.afterTaxInterest, null)
    assert.equal(r.inputs.assumptions.baseFreeCashFlow, 120)
  })

  test('without beta the discount rate falls back to 10% and warns', () => {
    const r = deriveDcfInputs(annual, { price: 10, sharesOutstanding: 1_000 }, { quarters: QUARTERS })
    assert.ok(r.ok)
    assert.equal(r.inputs.wacc, null)
    assert.equal(r.inputs.assumptions.discountRate, 0.1)
    assert.ok(r.inputs.warnings.some((w) => w.includes('beta')))
  })
})
