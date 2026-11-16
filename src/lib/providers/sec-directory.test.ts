import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { cleanCompanyName, isListed, normaliseExchange, rankEntries, sectorFromSic } from './sec-directory'

describe('cleanCompanyName', () => {
  test('title-cases EDGAR names and drops registration suffixes', () => {
    assert.equal(cleanCompanyName('COSTCO WHOLESALE CORP /NEW'), 'Costco Wholesale Corp')
    assert.equal(cleanCompanyName('COSTCO WHOLESALE CORP /NEW (COST)'), 'Costco Wholesale Corp')
  })
  test('keeps already mixed-case names and legal abbreviations', () => {
    assert.equal(cleanCompanyName('Alphabet Inc.'), 'Alphabet Inc.')
    assert.equal(cleanCompanyName('ENTERPRISE PRODUCTS PARTNERS LP'), 'Enterprise Products Partners LP')
  })
})

describe('rankEntries', () => {
  const rows = [
    { symbol: 'COSTX', name: 'Cost Plus', cik: '1', exchange: 'NASDAQ' },
    { symbol: 'COST', name: 'Costco Wholesale Corp', cik: '2', exchange: 'NASDAQ' },
    { symbol: 'WMT', name: 'Walmart Inc', cik: '3', exchange: 'NYSE' },
    { symbol: 'BJ', name: "BJ's Wholesale Club", cik: '4', exchange: 'NYSE' },
  ]
  test('exact ticker first, then ticker prefix', () => {
    assert.deepEqual(rankEntries(rows, 'cost', 5).map((r) => r.symbol), ['COST', 'COSTX'])
  })
  test('matches any word of the name', () => {
    assert.deepEqual(rankEntries(rows, 'wholesale', 5).map((r) => r.symbol).sort(), ['BJ', 'COST'])
  })
  test('nothing for an empty query', () => {
    assert.deepEqual(rankEntries(rows, '  ', 5), [])
  })
})

describe('exchanges', () => {
  test('normalises SEC spellings and rejects over-the-counter', () => {
    assert.equal(normaliseExchange('Nasdaq'), 'NASDAQ')
    assert.equal(normaliseExchange('NYSE'), 'NYSE')
    assert.ok(isListed('NASDAQ'))
    assert.ok(!isListed(normaliseExchange('OTC')))
    assert.ok(!isListed(null))
  })
})

describe('sectorFromSic', () => {
  test('maps common codes', () => {
    assert.equal(sectorFromSic('3674'), 'Technology') // semiconductors
    assert.equal(sectorFromSic('2834'), 'Healthcare') // pharma
    assert.equal(sectorFromSic('5331'), 'Consumer Staples') // Costco, Walmart
    assert.equal(sectorFromSic('6022'), 'Financials') // banks
    assert.equal(sectorFromSic('1311'), 'Energy')
    assert.equal(sectorFromSic(undefined), null)
  })
})
