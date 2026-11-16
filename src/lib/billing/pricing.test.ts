import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { pricingEnabled, upgradePath } from './pricing'

describe('pricing switch', () => {
  const original = process.env.NEXT_PUBLIC_PRICING_ENABLED
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_PRICING_ENABLED
    else process.env.NEXT_PUBLIC_PRICING_ENABLED = original
  })

  test('hidden unless explicitly enabled', () => {
    delete process.env.NEXT_PUBLIC_PRICING_ENABLED
    assert.equal(pricingEnabled(), false)
    assert.equal(upgradePath(), null)
    process.env.NEXT_PUBLIC_PRICING_ENABLED = 'yes'
    assert.equal(pricingEnabled(), false)
  })

  test('points upgrades at /pricing when enabled', () => {
    process.env.NEXT_PUBLIC_PRICING_ENABLED = 'true'
    assert.equal(upgradePath(), '/pricing')
  })
})
