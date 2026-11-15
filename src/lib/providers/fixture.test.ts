import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { FixtureProvider } from './fixture'
import { trailingTwelveMonths, type QuarterRow } from '@/lib/metrics'

describe('FixtureProvider quarters', () => {
  test('four quarters sum back to the fiscal year, so TTM equals the annual statement', async () => {
    const p = new FixtureProvider()
    const [annual] = await p.getAnnualFinancials('AAPL', 1)
    const quarters = await p.getQuarterlyFinancials('AAPL', 4)

    const ttm = trailingTwelveMonths(quarters as unknown as QuarterRow[])
    assert.ok(ttm, 'quarters must be consecutive')
    for (const k of ['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'freeCashFlow', 'epsDiluted'] as const) {
      assert.ok(Math.abs((ttm[k] ?? NaN) - (annual[k] ?? NaN)) < 1e-6 * Math.abs(annual[k] ?? 1), k)
    }
    assert.equal(ttm.totalAssets, annual.totalAssets)
    assert.equal(ttm.periodEnd, annual.periodEnd)
  })

  test('quarterly margins match annual margins', async () => {
    const p = new FixtureProvider()
    const [annual] = await p.getAnnualFinancials('MSFT', 1)
    const [q4] = await p.getQuarterlyFinancials('MSFT', 1)
    const margin = (r: typeof annual) => (r.grossProfit ?? 0) / (r.revenue ?? 1)
    assert.ok(Math.abs(margin(q4) - margin(annual)) < 1e-12)
  })
})
