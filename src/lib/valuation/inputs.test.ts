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
