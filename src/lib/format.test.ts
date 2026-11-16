import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatFairValue, MISSING, NOT_MEANINGFUL } from './format'

describe('formatFairValue', () => {
  test('a positive value is a price', () => {
    assert.equal(formatFairValue(181.4), '$181.40')
  })
  test('zero or negative is not meaningful, not a negative price', () => {
    assert.equal(formatFairValue(-84.35), NOT_MEANINGFUL)
    assert.equal(formatFairValue(0), NOT_MEANINGFUL)
  })
  test('missing stays missing', () => {
    assert.equal(formatFairValue(null), MISSING)
    assert.equal(formatFairValue(Number.NaN), MISSING)
  })
})
