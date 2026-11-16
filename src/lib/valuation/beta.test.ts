import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { betaFromCloses, monthEndCloses, type Close } from './beta'

/** Month-end closes for `n` complete months ending last month, from returns. */
function series(returns: number[]): Close[] {
  const now = new Date()
  const out: Close[] = []
  let price = 100
  for (let i = returns.length; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 0)) // last day of a past month
    if (i < returns.length) price *= 1 + returns[returns.length - 1 - i]
    out.push({ date: d.toISOString().slice(0, 10), close: price })
  }
  return out
}

const market = Array.from({ length: 60 }, (_, i) => Math.sin(i) * 0.04 + 0.005)

describe('betaFromCloses', () => {
  test('a stock that moves 1.5× the market has beta 1.5', () => {
    const b = betaFromCloses(series(market.map((r) => r * 1.5)), series(market))
    assert.ok(b != null && Math.abs(b - 1.5) < 1e-3)
  })

  test('the market against itself has beta 1', () => {
    assert.equal(betaFromCloses(series(market), series(market)), 1)
  })

  test('null with fewer than 24 months of overlap', () => {
    assert.equal(betaFromCloses(series(market.slice(0, 20)), series(market)), null)
  })

  test('uses only the last close of each month', () => {
    const m = monthEndCloses([
      { date: '2025-01-05', close: 1 },
      { date: '2025-01-31', close: 2 },
      { date: '2025-01-15', close: 3 },
    ])
    assert.equal(m.get('2025-01'), 2)
  })
})
