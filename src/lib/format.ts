/**
 * Display formatting. Shared by web pages and (as a spec) by the mobile client,
 * so a number looks identical on both surfaces.
 *
 * Every helper takes `number | null | undefined` and returns the em-dash for
 * missing values. Formatting is the last place that should invent a zero.
 */

export const MISSING = '—'

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** Large absolute currency values: 394.33B, 1.2T. */
export function formatCurrencyCompact(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !isFinite(value)) return MISSING
  const symbol = currency === 'USD' ? '$' : ''
  const sign = value < 0 ? '-' : ''
  return `${sign}${symbol}${compact.format(Math.abs(value))}`
}

/** Per-share prices — always 2dp, never compacted. A price of "1.23K" is unreadable. */
export function formatPrice(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !isFinite(value)) return MISSING
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}

/** Shown instead of a fair value that is zero or negative. */
export const NOT_MEANINGFUL = 'n/m'
export const NOT_MEANINGFUL_REASON =
  'Not meaningful: the starting cash flow is negative, so a DCF gives a negative value. Use other measures for this company.'

/**
 * A DCF fair value. Zero or negative means the company is burning cash at the
 * starting point — not "worth −$84 a share" — so it reads as n/m instead.
 */
export function formatFairValue(value: number | null | undefined, currency = 'USD'): string {
  if (value != null && isFinite(value) && value <= 0) return NOT_MEANINGFUL
  return formatPrice(value, currency)
}

/** Decimal fraction in, percent out: 0.2534 → "25.3%". */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !isFinite(value)) return MISSING
  return `${(value * 100).toFixed(digits)}%`
}

/** Same as formatPercent but always carries an explicit sign — for deltas. */
export function formatSignedPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !isFinite(value)) return MISSING
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(digits)}%`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return MISSING
  return plain.format(value)
}

export function formatMultiple(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return MISSING
  return `${value.toFixed(1)}×`
}

/** Tailwind class for a signed value. Neutral (not green) when unknown. */
export function toneForSigned(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return 'text-zinc-400'
  if (value > 0) return 'text-emerald-500'
  if (value < 0) return 'text-rose-500'
  return 'text-zinc-400'
}
