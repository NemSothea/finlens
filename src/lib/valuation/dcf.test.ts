import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateDcf,
  reverseDcf,
  marginOfSafety,
  normaliseFreeCashFlow,
  type DcfAssumptions,
} from './dcf'

const base: DcfAssumptions = {
  baseFreeCashFlow: 100_000_000,
  sharesOutstanding: 10_000_000,
  netDebt: 0,
  growthRate: 0.08,
  growthYears: 10,
  terminalGrowthRate: 0.025,
  discountRate: 0.1,
  fade: false,
}

describe('calculateDcf', () => {
  test('matches a hand-computed single-year perpetuity', () => {
    // 1 year horizon, zero growth: FCF1 = 100, PV = 100/1.1 = 90.909…
    // TV = 100 * 1.025 / (0.10 - 0.025) = 1366.66…, PV(TV) = TV / 1.1
    const r = calculateDcf({
      ...base,
      baseFreeCashFlow: 100,
      sharesOutstanding: 1,
      growthRate: 0,
      growthYears: 1,
    })

    assert.ok(Math.abs(r.pvOfForecast - 100 / 1.1) < 1e-9)

    const expectedTv = (100 * 1.025) / (0.1 - 0.025)
    assert.ok(Math.abs(r.terminalValue - expectedTv) < 1e-9)
    assert.ok(Math.abs(r.pvOfTerminalValue - expectedTv / 1.1) < 1e-9)
    assert.ok(Math.abs(r.fairValuePerShare - (100 / 1.1 + expectedTv / 1.1)) < 1e-9)
  })

  test('net debt reduces equity value one-for-one', () => {
    const noDebt = calculateDcf(base)
    const withDebt = calculateDcf({ ...base, netDebt: 50_000_000 })

    assert.equal(noDebt.enterpriseValue, withDebt.enterpriseValue)
    assert.ok(Math.abs(noDebt.equityValue - withDebt.equityValue - 50_000_000) < 1e-6)
  })

  test('net cash (negative net debt) increases equity value', () => {
    const r = calculateDcf({ ...base, netDebt: -20_000_000 })
    assert.ok(r.equityValue > r.enterpriseValue)
  })

  test('higher discount rate lowers fair value', () => {
    const cheap = calculateDcf({ ...base, discountRate: 0.08 })
    const dear = calculateDcf({ ...base, discountRate: 0.14 })
    assert.ok(dear.fairValuePerShare < cheap.fairValuePerShare)
  })

  test('higher growth raises fair value', () => {
    const slow = calculateDcf({ ...base, growthRate: 0.03 })
    const fast = calculateDcf({ ...base, growthRate: 0.15 })
    assert.ok(fast.fairValuePerShare > slow.fairValuePerShare)
  })

  test('fade produces a lower value than a flat high growth rate', () => {
    // Fading 20% down to terminal must be worth less than holding 20% flat.
    const flat = calculateDcf({ ...base, growthRate: 0.2, fade: false })
    const faded = calculateDcf({ ...base, growthRate: 0.2, fade: true })
    assert.ok(faded.fairValuePerShare < flat.fairValuePerShare)
  })

  test('fade starts at the stage-1 rate and ends at terminal', () => {
    const r = calculateDcf({ ...base, growthRate: 0.2, fade: true })
    assert.ok(Math.abs(r.years[0].growthRate - 0.2) < 1e-12)
    assert.ok(Math.abs(r.years[r.years.length - 1].growthRate - base.terminalGrowthRate) < 1e-12)
  })

  test('projects exactly growthYears periods', () => {
    assert.equal(calculateDcf({ ...base, growthYears: 15 }).years.length, 15)
  })

  test('terminal value share is reported and bounded', () => {
    const r = calculateDcf(base)
    assert.ok(r.terminalValueShare > 0 && r.terminalValueShare < 1)
  })

  test('rejects discount rate at or below terminal growth', () => {
    // Gordon growth divides by (r - g); this must fail loudly, not return Infinity.
    assert.throws(
      () => calculateDcf({ ...base, discountRate: 0.02, terminalGrowthRate: 0.025 }),
      RangeError,
    )
    assert.throws(
      () => calculateDcf({ ...base, discountRate: 0.025, terminalGrowthRate: 0.025 }),
      RangeError,
    )
  })

  test('rejects non-positive share count', () => {
    assert.throws(() => calculateDcf({ ...base, sharesOutstanding: 0 }), RangeError)
  })

  test('rejects invalid horizon', () => {
    assert.throws(() => calculateDcf({ ...base, growthYears: 0 }), RangeError)
    assert.throws(() => calculateDcf({ ...base, growthYears: 2.5 }), RangeError)
  })

  test('negative base FCF yields a negative fair value rather than throwing', () => {
    // Unprofitable companies are a real input; the caller decides how to present it.
    const r = calculateDcf({ ...base, baseFreeCashFlow: -50_000_000 })
    assert.ok(r.fairValuePerShare < 0)
  })
})

describe('reverseDcf', () => {
  test('recovers the growth rate used to produce a price', () => {
    const forward = calculateDcf({ ...base, growthRate: 0.12 })
    const { impliedGrowthRate, converged } = reverseDcf({
      ...base,
      currentPrice: forward.fairValuePerShare,
    })

    assert.ok(converged)
    assert.ok(Math.abs(impliedGrowthRate - 0.12) < 1e-4)
  })

  test('an expensive price implies higher growth than a cheap one', () => {
    const cheap = reverseDcf({ ...base, currentPrice: 500 })
    const expensive = reverseDcf({ ...base, currentPrice: 5_000 })
    assert.ok(expensive.impliedGrowthRate > cheap.impliedGrowthRate)
  })

  test('reports non-convergence instead of a bogus precise answer', () => {
    // Far outside the -50%..+100% bracket.
    const r = reverseDcf({ ...base, currentPrice: 1e12 })
    assert.equal(r.converged, false)
  })
})

describe('marginOfSafety', () => {
  test('positive when price is below fair value', () => {
    assert.ok(Math.abs(marginOfSafety(100, 75) - 0.25) < 1e-12)
  })

  test('negative when price is above fair value', () => {
    assert.ok(marginOfSafety(100, 125) < 0)
  })

  test('NaN for meaningless inputs rather than a misleading number', () => {
    assert.ok(Number.isNaN(marginOfSafety(-10, 50)))
    assert.ok(Number.isNaN(marginOfSafety(100, 0)))
  })
})

describe('normaliseFreeCashFlow', () => {
  test('averages the requested number of recent years', () => {
    assert.equal(normaliseFreeCashFlow([100, 200, 300, 999], 3), 200)
  })

  test('skips nulls from missing vendor line items', () => {
    assert.equal(normaliseFreeCashFlow([100, null, 300], 3), 200)
  })

  test('returns null when nothing usable is present', () => {
    assert.equal(normaliseFreeCashFlow([null, null]), null)
  })
})

describe('calculateDcf — three-stage', () => {
  const three: DcfAssumptions = { ...base, growthRate: 0.2, growthYears: 5, transitionYears: 15 }

  test('projects growthYears + transitionYears periods, tagged by stage', () => {
    const r = calculateDcf(three)
    assert.equal(r.years.length, 20)
    assert.deepEqual(
      [r.years[4].stage, r.years[5].stage, r.years[19].stage],
      [1, 2, 2],
    )
  })

  test('holds stage 1 flat, then fades linearly to land on terminal growth', () => {
    const r = calculateDcf(three)
    for (let i = 0; i < 5; i++) assert.equal(r.years[i].growthRate, 0.2)
    // Year 6: one fifteenth of the way down.
    assert.ok(Math.abs(r.years[5].growthRate - (0.2 + (0.025 - 0.2) / 15)) < 1e-12)
    assert.ok(Math.abs(r.years[19].growthRate - 0.025) < 1e-12)
  })

  test('terminal value is discounted from the end of the full horizon', () => {
    const r = calculateDcf(three)
    const last = r.years[19]
    const tv = (last.freeCashFlow * 1.025) / (0.1 - 0.025)
    assert.ok(Math.abs(r.terminalValue - tv) < 1e-3)
    assert.ok(Math.abs(r.pvOfTerminalValue - tv / 1.1 ** 20) < 1e-3)
  })

  test('ignores the fade flag — the transition stage is the fade', () => {
    const a = calculateDcf({ ...three, fade: true })
    const b = calculateDcf({ ...three, fade: false })
    assert.equal(a.fairValuePerShare, b.fairValuePerShare)
  })

  test('transitionYears 0 is exactly the two-stage model', () => {
    const two = calculateDcf({ ...base, fade: true })
    const zero = calculateDcf({ ...base, fade: true, transitionYears: 0 })
    assert.equal(two.fairValuePerShare, zero.fairValuePerShare)
  })

  test('rejects a negative or fractional transition', () => {
    assert.throws(() => calculateDcf({ ...three, transitionYears: -1 }), RangeError)
    assert.throws(() => calculateDcf({ ...three, transitionYears: 1.5 }), RangeError)
  })

  test('reverse DCF solves stage-1 growth under the three-stage model', () => {
    const price = calculateDcf(three).fairValuePerShare
    const implied = reverseDcf({ ...three, currentPrice: price })
    assert.ok(implied.converged)
    assert.ok(Math.abs(implied.impliedGrowthRate - 0.2) < 1e-5)
  })
})
