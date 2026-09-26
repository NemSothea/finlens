import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { derivePositions, summarisePortfolio, type Transaction } from './positions'

let nextId = 1

function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: nextId++,
    symbol: 'AAPL',
    kind: 'buy',
    quantity: 10,
    pricePerShare: 100,
    fees: 0,
    tradedAt: new Date('2024-01-01T00:00:00Z'),
    ...over,
  }
}

/** Money comparisons need a tolerance — average cost divides and multiplies. */
function close(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  )
}

describe('derivePositions — buys', () => {
  test('a single buy sets quantity, basis and average cost', () => {
    const { positions } = derivePositions([tx({ quantity: 10, pricePerShare: 100 })])

    assert.equal(positions.length, 1)
    assert.equal(positions[0].quantity, 10)
    close(positions[0].costBasis, 1_000)
    close(positions[0].averageCost!, 100)
    assert.equal(positions[0].closed, false)
  })

  test('fees are capitalised into the cost basis', () => {
    // Excluding fees would overstate every future gain by the fee amount.
    const { positions } = derivePositions([tx({ quantity: 10, pricePerShare: 100, fees: 9.99 })])

    close(positions[0].costBasis, 1_009.99)
    close(positions[0].averageCost!, 100.999)
  })

  test('two buys at different prices average correctly', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ quantity: 10, pricePerShare: 200, tradedAt: new Date('2024-06-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].quantity, 20)
    close(positions[0].costBasis, 3_000)
    close(positions[0].averageCost!, 150)
  })

  test('separate symbols become separate positions', () => {
    const { positions } = derivePositions([tx({ symbol: 'AAPL' }), tx({ symbol: 'MSFT' })])
    assert.deepEqual(positions.map((p) => p.symbol).sort(), ['AAPL', 'MSFT'])
  })

  test('symbols are normalised to upper case', () => {
    const { positions } = derivePositions([tx({ symbol: 'aapl' }), tx({ symbol: 'AAPL' })])
    assert.equal(positions.length, 1)
    assert.equal(positions[0].symbol, 'AAPL')
  })
})

describe('derivePositions — sells', () => {
  test('a partial sell reduces basis by average cost, not sale price', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({
        kind: 'sell',
        quantity: 4,
        pricePerShare: 150,
        tradedAt: new Date('2024-06-01T00:00:00Z'),
      }),
    ])

    assert.equal(positions[0].quantity, 6)
    close(positions[0].costBasis, 600) // 6 × 100, not 1000 − 600 proceeds
    close(positions[0].averageCost!, 100)
    close(positions[0].realizedGain, 200) // 4 × (150 − 100)
  })

  test('sell fees reduce realized gain', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({
        kind: 'sell',
        quantity: 4,
        pricePerShare: 150,
        fees: 5,
        tradedAt: new Date('2024-06-01T00:00:00Z'),
      }),
    ])

    close(positions[0].realizedGain, 195)
  })

  test('a sell at a loss produces a negative realized gain', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({
        kind: 'sell',
        quantity: 10,
        pricePerShare: 60,
        tradedAt: new Date('2024-06-01T00:00:00Z'),
      }),
    ])

    close(positions[0].realizedGain, -400)
  })

  test('selling everything closes the position and clears the basis', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({
        kind: 'sell',
        quantity: 10,
        pricePerShare: 150,
        tradedAt: new Date('2024-06-01T00:00:00Z'),
      }),
    ])

    assert.equal(positions[0].quantity, 0)
    assert.equal(positions[0].costBasis, 0)
    assert.equal(positions[0].averageCost, null)
    assert.equal(positions[0].closed, true)
    close(positions[0].realizedGain, 500)
  })

  test('rebuying after a full exit reopens the position cleanly', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ kind: 'sell', quantity: 10, pricePerShare: 150, tradedAt: new Date('2024-06-01T00:00:00Z') }),
      tx({ quantity: 5, pricePerShare: 200, tradedAt: new Date('2024-09-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].closed, false)
    assert.equal(positions[0].quantity, 5)
    close(positions[0].costBasis, 1_000)
    close(positions[0].averageCost!, 200) // not polluted by the old basis
    close(positions[0].realizedGain, 500) // history is kept
  })

  test('overselling warns and clamps instead of going negative', () => {
    // A negative quantity would silently poison every downstream number.
    const { positions, warnings } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ kind: 'sell', quantity: 15, pricePerShare: 150, tradedAt: new Date('2024-06-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].quantity, 0)
    assert.ok(positions[0].costBasis >= 0)
    assert.equal(warnings.length, 1)
    assert.ok(warnings[0].includes('only 10'))
  })
})

describe('derivePositions — dividends and splits', () => {
  test('a dividend adds income without touching quantity or basis', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({
        kind: 'dividend',
        quantity: 10,
        pricePerShare: 0.5,
        tradedAt: new Date('2024-06-01T00:00:00Z'),
      }),
    ])

    assert.equal(positions[0].quantity, 10)
    close(positions[0].costBasis, 1_000)
    close(positions[0].dividendIncome, 5)
    close(positions[0].realizedGain, 0) // income is not a capital gain
  })

  test('a 2-for-1 split doubles shares and halves average cost', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ kind: 'split', quantity: 2, pricePerShare: 0, tradedAt: new Date('2024-06-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].quantity, 20)
    close(positions[0].costBasis, 1_000) // a split creates no value
    close(positions[0].averageCost!, 50)
  })

  test('a reverse split works the same way', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ kind: 'split', quantity: 0.5, pricePerShare: 0, tradedAt: new Date('2024-06-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].quantity, 5)
    close(positions[0].costBasis, 1_000)
    close(positions[0].averageCost!, 200)
  })

  test('a non-positive split ratio is ignored with a warning', () => {
    const { positions, warnings } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ kind: 'split', quantity: 0, pricePerShare: 0, tradedAt: new Date('2024-06-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].quantity, 10)
    assert.equal(warnings.length, 1)
  })

  test('a sell after a split uses the post-split average cost', () => {
    const { positions } = derivePositions([
      tx({ quantity: 10, pricePerShare: 100 }),
      tx({ kind: 'split', quantity: 2, pricePerShare: 0, tradedAt: new Date('2024-06-01T00:00:00Z') }),
      tx({ kind: 'sell', quantity: 10, pricePerShare: 80, tradedAt: new Date('2024-09-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].quantity, 10)
    close(positions[0].realizedGain, 300) // 10 × (80 − 50)
  })
})

describe('derivePositions — ordering', () => {
  test('replays chronologically regardless of input order', () => {
    const buy = tx({ quantity: 10, pricePerShare: 100, tradedAt: new Date('2024-01-01T00:00:00Z') })
    const sell = tx({
      kind: 'sell',
      quantity: 10,
      pricePerShare: 150,
      tradedAt: new Date('2024-06-01T00:00:00Z'),
    })

    const forward = derivePositions([buy, sell])
    const reversed = derivePositions([sell, buy])

    assert.equal(reversed.warnings.length, 0, 'sell-first input must not report overselling')
    close(reversed.positions[0].realizedGain, forward.positions[0].realizedGain)
  })

  test('same-timestamp trades break ties on id, deterministically', () => {
    const at = new Date('2024-01-01T00:00:00Z')
    const a = { ...tx({ quantity: 10, pricePerShare: 100, tradedAt: at }), id: 1 }
    const b = {
      ...tx({ kind: 'sell' as const, quantity: 10, pricePerShare: 150, tradedAt: at }),
      id: 2,
    }

    const one = derivePositions([a, b])
    const two = derivePositions([b, a])

    assert.equal(one.warnings.length, 0)
    close(one.positions[0].realizedGain, two.positions[0].realizedGain)
  })

  test('openedAt is the first trade date', () => {
    const { positions } = derivePositions([
      tx({ tradedAt: new Date('2024-06-01T00:00:00Z') }),
      tx({ tradedAt: new Date('2024-01-01T00:00:00Z') }),
    ])

    assert.equal(positions[0].openedAt.toISOString().slice(0, 10), '2024-01-01')
  })
})

describe('summarisePortfolio', () => {
  const trades = [
    tx({ symbol: 'AAPL', quantity: 10, pricePerShare: 100 }),
    tx({ symbol: 'MSFT', quantity: 5, pricePerShare: 200 }),
  ]

  test('computes market value, unrealized gain and weights', () => {
    const summary = summarisePortfolio(
      trades,
      new Map([
        ['AAPL', 150],
        ['MSFT', 200],
      ]),
    )

    close(summary.totalMarketValue, 2_500) // 1500 + 1000
    close(summary.totalCostBasis, 2_000)
    close(summary.totalUnrealizedGain, 500)

    const aapl = summary.positions.find((p) => p.symbol === 'AAPL')!
    close(aapl.marketValue!, 1_500)
    close(aapl.unrealizedGain!, 500)
    close(aapl.unrealizedGainPct!, 0.5)
    close(aapl.weight!, 0.6)
  })

  test('sorts positions by market value, largest first', () => {
    const summary = summarisePortfolio(
      trades,
      new Map([
        ['AAPL', 150],
        ['MSFT', 200],
      ]),
    )
    assert.deepEqual(summary.positions.map((p) => p.symbol), ['AAPL', 'MSFT'])
  })

  test('an unpriced holding is reported, not counted as zero', () => {
    // Counting it as zero would understate the portfolio without saying so.
    const summary = summarisePortfolio(trades, new Map([['AAPL', 150]]))

    assert.deepEqual(summary.unpricedSymbols, ['MSFT'])
    close(summary.totalMarketValue, 1_500)

    const msft = summary.positions.find((p) => p.symbol === 'MSFT')!
    assert.equal(msft.marketValue, null)
    assert.equal(msft.unrealizedGain, null)
    assert.equal(msft.weight, null)
  })

  test('total return includes realized gains and dividends', () => {
    const summary = summarisePortfolio(
      [
        tx({ symbol: 'AAPL', quantity: 10, pricePerShare: 100 }),
        tx({
          symbol: 'AAPL',
          kind: 'dividend',
          quantity: 10,
          pricePerShare: 2,
          tradedAt: new Date('2024-03-01T00:00:00Z'),
        }),
        tx({
          symbol: 'AAPL',
          kind: 'sell',
          quantity: 5,
          pricePerShare: 150,
          tradedAt: new Date('2024-06-01T00:00:00Z'),
        }),
      ],
      new Map([['AAPL', 150]]),
    )

    close(summary.totalRealizedGain, 250)
    close(summary.totalDividendIncome, 20)
    close(summary.totalUnrealizedGain, 250)
    close(summary.totalReturnPct!, (250 + 250 + 20) / 500)
  })

  test('closed positions are hidden by default but keep contributing realized gains', () => {
    const closedOut = [
      tx({ symbol: 'AAPL', quantity: 10, pricePerShare: 100 }),
      tx({
        symbol: 'AAPL',
        kind: 'sell',
        quantity: 10,
        pricePerShare: 150,
        tradedAt: new Date('2024-06-01T00:00:00Z'),
      }),
    ]

    const summary = summarisePortfolio(closedOut, new Map([['AAPL', 150]]))
    assert.equal(summary.positions.length, 0)
    close(summary.totalRealizedGain, 500)

    const withClosed = summarisePortfolio(closedOut, new Map([['AAPL', 150]]), {
      includeClosed: true,
    })
    assert.equal(withClosed.positions.length, 1)
  })

  test('total return is null when nothing has a price', () => {
    // A 0% return would be a lie; unknown is the honest answer.
    const summary = summarisePortfolio(trades, new Map())
    assert.equal(summary.totalReturnPct, null)
  })

  test('an empty portfolio produces zeroes and no crash', () => {
    const summary = summarisePortfolio([], new Map())

    assert.equal(summary.positions.length, 0)
    assert.equal(summary.totalMarketValue, 0)
    assert.equal(summary.totalReturnPct, null)
    assert.deepEqual(summary.warnings, [])
  })

  test('propagates derivation warnings to the caller', () => {
    const summary = summarisePortfolio(
      [
        tx({ symbol: 'AAPL', quantity: 5, pricePerShare: 100 }),
        tx({
          symbol: 'AAPL',
          kind: 'sell',
          quantity: 50,
          pricePerShare: 150,
          tradedAt: new Date('2024-06-01T00:00:00Z'),
        }),
      ],
      new Map([['AAPL', 150]]),
    )

    assert.equal(summary.warnings.length, 1)
  })
})
