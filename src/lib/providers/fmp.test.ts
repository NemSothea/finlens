import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { pickNextEarningsDate } from './fmp'

describe('pickNextEarningsDate', () => {
  // Shape of a real `/stable/earnings` response: newest first, past and future mixed.
  const rows = [
    { symbol: 'NVDA', date: '2027-02-24', epsActual: null },
    { symbol: 'NVDA', date: '2026-11-17', epsActual: null },
    { symbol: 'NVDA', date: '2026-08-26', epsActual: 2.22 },
  ]

  test('earliest upcoming report, not the first row', () => {
    assert.equal(pickNextEarningsDate(rows, '2026-11-11'), '2026-11-17')
  })

  test('a report due today counts until its EPS is published', () => {
    assert.equal(pickNextEarningsDate(rows, '2026-11-17'), '2026-11-17')
  })

  test('skips past dates even without reported EPS', () => {
    assert.equal(pickNextEarningsDate(rows, '2026-12-01'), '2027-02-24')
  })

  test('null when nothing is scheduled', () => {
    assert.equal(pickNextEarningsDate(rows.slice(2), '2026-11-11'), null)
    assert.equal(pickNextEarningsDate([], '2026-11-11'), null)
  })

  test('ignores malformed rows', () => {
    assert.equal(pickNextEarningsDate([{ nope: 1 }, ...rows], '2026-11-11'), '2026-11-17')
  })
})
