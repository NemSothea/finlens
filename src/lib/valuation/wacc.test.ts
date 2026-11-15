import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeWacc, effectiveTaxRate, FALLBACK_TAX_RATE, type WaccInput } from './wacc'

const input: WaccInput = {
  beta: 1.2,
  marketCap: 800,
  totalDebt: 200,
  interestExpense: 10,
  incomeTax: 20,
  netIncome: 80,
  riskFreeRate: 0.04,
  equityRiskPremium: 0.05,
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-12

describe('computeWacc', () => {
  test('matches a hand computation', () => {
    const r = computeWacc(input)
    assert.ok(r.ok)
    const b = r.breakdown
    assert.ok(close(b.costOfEquity, 0.04 + 1.2 * 0.05)) // 10%
    assert.ok(close(b.preTaxCostOfDebt, 0.05)) // 10 / 200
    assert.ok(close(b.taxRate, 0.2)) // 20 / (80 + 20)
    assert.ok(close(b.afterTaxCostOfDebt, 0.04))
    assert.ok(close(b.equityWeight, 0.8))
    assert.ok(close(b.wacc, 0.8 * 0.1 + 0.2 * 0.04)) // 8.8%
    assert.deepEqual(b.notes, [])
  })

  test('a debt-free company has WACC equal to its cost of equity', () => {
    const r = computeWacc({ ...input, totalDebt: 0, interestExpense: 0 })
    assert.ok(r.ok)
    assert.ok(close(r.breakdown.wacc, r.breakdown.costOfEquity))
  })

  test('ignores the sign vendors put on interest expense', () => {
    const a = computeWacc(input)
    const b = computeWacc({ ...input, interestExpense: -10 })
    assert.ok(a.ok && b.ok)
    assert.equal(a.breakdown.wacc, b.breakdown.wacc)
  })

  test('clamps an extreme beta and says so', () => {
    const r = computeWacc({ ...input, beta: 5 })
    assert.ok(r.ok)
    assert.equal(r.breakdown.beta, 3)
    assert.equal(r.breakdown.notes.length, 1)
  })

  test('falls back to a statutory tax rate in a loss year', () => {
    const r = computeWacc({ ...input, netIncome: -50, incomeTax: 0 })
    assert.ok(r.ok)
    assert.equal(r.breakdown.taxRate, FALLBACK_TAX_RATE)
    assert.ok(r.breakdown.notes.some((n) => n.includes('tax')))
  })

  test('falls back to risk-free + spread when interest is missing', () => {
    const r = computeWacc({ ...input, interestExpense: null })
    assert.ok(r.ok)
    assert.ok(close(r.breakdown.preTaxCostOfDebt, 0.055))
    assert.equal(r.breakdown.costOfDebtSource, 'fallback')
    const reported = computeWacc(input)
    assert.ok(reported.ok)
    assert.equal(reported.breakdown.costOfDebtSource, 'reported')
  })

  test('fails with a typed reason without beta or market cap', () => {
    assert.deepEqual(computeWacc({ ...input, beta: null }), { ok: false, reason: 'no-beta' })
    assert.deepEqual(computeWacc({ ...input, marketCap: 0 }), { ok: false, reason: 'no-market-cap' })
  })
})

describe('effectiveTaxRate', () => {
  test('income tax over pre-tax income', () => {
    assert.ok(close(effectiveTaxRate(25, 75)!, 0.25))
  })
  test('null for losses and tax benefits', () => {
    assert.equal(effectiveTaxRate(5, -20), null)
    assert.equal(effectiveTaxRate(-5, 100), null)
  })
})
