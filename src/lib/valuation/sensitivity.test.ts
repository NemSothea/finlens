import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildAxis, buildSensitivityGrid, gridSupportRatio } from './sensitivity'
import type { DcfAssumptions } from './dcf'

const base: DcfAssumptions = {
  baseFreeCashFlow: 100_000_000,
  sharesOutstanding: 10_000_000,
  netDebt: 0,
  growthRate: 0.08,
  growthYears: 10,
  terminalGrowthRate: 0.025,
  discountRate: 0.1,
  fade: true,
}

describe('buildAxis', () => {
  test('centres on the given value', () => {
    const axis = buildAxis(0.08, 0.02, 5)
    assert.equal(axis.length, 5)
    assert.equal(axis[2], 0.08)
  })

  test('steps symmetrically and stays free of floating-point dust', () => {
    // Naive arithmetic here yields 0.060000000000000005, which renders as
    // "6.0000000000000005%" in an axis label.
    assert.deepEqual(buildAxis(0.08, 0.02, 5), [0.04, 0.06, 0.08, 0.1, 0.12])
  })

  test('clamps at the floor instead of producing absurd rates', () => {
    const axis = buildAxis(0.02, 0.05, 5, 0.01)
    assert.ok(axis.every((v) => v >= 0.01))
  })
})

describe('buildSensitivityGrid', () => {
  test('is discount-major, growth-minor', () => {
    const grid = buildSensitivityGrid(base, 100)
    assert.equal(grid.cells.length, grid.discountRates.length)
    assert.equal(grid.cells[0].length, grid.growthRates.length)
  })

  test('fair value rises across a row as growth rises', () => {
    const grid = buildSensitivityGrid(base, 100)
    const row = grid.cells[0]
    for (let i = 1; i < row.length; i++) {
      assert.ok(row[i].fairValuePerShare > row[i - 1].fairValuePerShare)
    }
  })

  test('fair value falls down a column as the discount rate rises', () => {
    const grid = buildSensitivityGrid(base, 100)
    for (let r = 1; r < grid.cells.length; r++) {
      assert.ok(grid.cells[r][0].fairValuePerShare < grid.cells[r - 1][0].fairValuePerShare)
    }
  })

  test('marks cells invalid instead of throwing when discount <= terminal growth', () => {
    // Centre the discount axis low enough that its bottom steps fall under
    // terminal growth — Gordon growth has no answer there.
    const grid = buildSensitivityGrid({ ...base, discountRate: 0.03 }, 100, {
      discountStep: 0.01,
    })

    const invalid = grid.cells.flat().filter((c) => c.invalid)
    assert.ok(invalid.length > 0)
    assert.ok(invalid.every((c) => c.marginOfSafety === null))
  })

  test('omits margin of safety when there is no price', () => {
    const grid = buildSensitivityGrid(base, null)
    assert.ok(grid.cells.flat().every((c) => c.marginOfSafety === null))
  })
})

describe('gridSupportRatio', () => {
  test('is 1 when every cell clears the price', () => {
    assert.equal(gridSupportRatio(buildSensitivityGrid(base, 0.01), 0.01), 1)
  })

  test('is 0 when no cell clears the price', () => {
    assert.equal(gridSupportRatio(buildSensitivityGrid(base, 1e9), 1e9), 0)
  })

  test('lands between 0 and 1 when the conclusion depends on the assumptions', () => {
    const centre = buildSensitivityGrid(base, 100).cells[2][2].fairValuePerShare
    const ratio = gridSupportRatio(buildSensitivityGrid(base, centre), centre)
    assert.ok(ratio !== null && ratio > 0 && ratio < 1)
  })

  test('is null without a price', () => {
    assert.equal(gridSupportRatio(buildSensitivityGrid(base, null), null), null)
  })
})
