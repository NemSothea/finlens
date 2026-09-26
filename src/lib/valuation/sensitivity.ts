import { calculateDcf, marginOfSafety, type DcfAssumptions } from './dcf'

/**
 * Growth × discount-rate sensitivity grid.
 *
 * A single fair value invites false precision — it looks like a measurement
 * when it is an opinion about two numbers nobody knows. The grid shows how much
 * the answer moves when those two assumptions move, which is the honest way to
 * present it: if the whole grid is above the price, the thesis survives the
 * assumptions; if it straddles the price, it does not.
 */

export interface SensitivityCell {
  growthRate: number
  discountRate: number
  fairValuePerShare: number
  marginOfSafety: number | null
  /** True when the discount rate is at or below terminal growth — no valid answer. */
  invalid: boolean
}

export interface SensitivityGrid {
  growthRates: number[]
  discountRates: number[]
  /** Row-major: `cells[discountRateIndex][growthRateIndex]`. */
  cells: SensitivityCell[][]
}

/** Symmetric steps around a centre value, clamped so rates stay sane. */
export function buildAxis(centre: number, step: number, count = 5, min = -0.5): number[] {
  const half = Math.floor(count / 2)
  return Array.from({ length: count }, (_, i) => {
    const value = centre + (i - half) * step
    // Round to kill floating-point dust like 0.07000000000000001 in axis labels.
    return Math.max(min, Math.round(value * 10_000) / 10_000)
  })
}

export function buildSensitivityGrid(
  assumptions: DcfAssumptions,
  currentPrice: number | null,
  options: { growthStep?: number; discountStep?: number; size?: number } = {},
): SensitivityGrid {
  const { growthStep = 0.02, discountStep = 0.01, size = 5 } = options

  const growthRates = buildAxis(assumptions.growthRate, growthStep, size)
  const discountRates = buildAxis(assumptions.discountRate, discountStep, size, 0.01)

  const cells = discountRates.map((discountRate) =>
    growthRates.map((growthRate) => {
      // Gordon growth is undefined at r <= g. Mark the cell instead of letting
      // calculateDcf throw and take the whole grid down with it.
      if (discountRate <= assumptions.terminalGrowthRate) {
        return {
          growthRate,
          discountRate,
          fairValuePerShare: Number.NaN,
          marginOfSafety: null,
          invalid: true,
        }
      }

      const { fairValuePerShare } = calculateDcf({ ...assumptions, growthRate, discountRate })

      return {
        growthRate,
        discountRate,
        fairValuePerShare,
        marginOfSafety: currentPrice ? marginOfSafety(fairValuePerShare, currentPrice) : null,
        invalid: false,
      }
    }),
  )

  return { growthRates, discountRates, cells }
}

/**
 * Share of grid cells where fair value exceeds the current price.
 *
 * The headline robustness number: 1.0 means every assumption pair in the range
 * says the stock is cheap; 0.5 means the conclusion is a coin flip on inputs
 * you guessed.
 */
export function gridSupportRatio(grid: SensitivityGrid, currentPrice: number | null): number | null {
  if (!currentPrice || currentPrice <= 0) return null

  const valid = grid.cells.flat().filter((c) => !c.invalid && isFinite(c.fairValuePerShare))
  if (valid.length === 0) return null

  return valid.filter((c) => c.fairValuePerShare > currentPrice).length / valid.length
}
