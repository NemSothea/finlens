import { ProviderError } from './types'

/**
 * Minimal token-bucket limiter. Vendors ban on burst far more aggressively
 * than on sustained volume, so the ingest pipeline must pace itself rather
 * than firing 2,000 requests at once and hoping.
 */
export class RateLimiter {
  private tokens: number
  private lastRefill = 0
  private queue: Array<() => void> = []

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  private refill() {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    if (elapsed <= 0) return
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond)
    this.lastRefill = now
  }

  async take(): Promise<void> {
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }
    const waitMs = Math.ceil(((1 - this.tokens) / this.refillPerSecond) * 1000)
    await new Promise((r) => setTimeout(r, waitMs))
    return this.take()
  }
}

/** Bounded-concurrency map. Keeps memory flat and the vendor happy. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<Array<{ item: T; result?: R; error?: unknown }>> {
  const out: Array<{ item: T; result?: R; error?: unknown }> = new Array(items.length)
  let cursor = 0

  const worker = async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      try {
        out[i] = { item: items[i], result: await fn(items[i], i) }
      } catch (error) {
        // One bad symbol must never abort a 2,000-symbol run.
        out[i] = { item: items[i], error }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return out
}

export interface FetchJsonOptions {
  limiter?: RateLimiter
  retries?: number
  timeoutMs?: number
  /** Called once per actual network attempt — used for vendor-call accounting. */
  onAttempt?: () => void
  /** Extra request headers (SEC requires a declared User-Agent). */
  headers?: Record<string, string>
}

/**
 * Retries 429 and 5xx with exponential backoff + jitter. Never retries other
 * 4xx: a bad API key or an unknown ticker will fail identically forever, and
 * retrying it just burns quota and hides the real error.
 */
export async function fetchJson<T = unknown>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { limiter, retries = 3, timeoutMs = 20_000, onAttempt, headers } = opts

  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (limiter) await limiter.take()
    onAttempt?.()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/json', ...headers },
      })

      if (res.ok) return (await res.json()) as T

      const retryable = res.status === 429 || res.status >= 500
      const body = await res.text().catch(() => '')
      const err = new ProviderError(
        `HTTP ${res.status} for ${redact(url)}: ${body.slice(0, 200)}`,
        res.status,
        retryable,
      )
      if (!retryable) throw err
      lastError = err
    } catch (error) {
      if (error instanceof ProviderError && !error.retryable) throw error
      lastError = error
    } finally {
      clearTimeout(timer)
    }

    if (attempt < retries) {
      const backoff = 500 * 2 ** attempt + Math.floor(Math.random() * 250)
      await new Promise((r) => setTimeout(r, backoff))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ProviderError(`Request failed for ${redact(url)}`)
}

/** Strip API keys before anything reaches a log line or an error report. */
export function redact(url: string): string {
  return url.replace(/([?&](apikey|api_key|token|key)=)[^&]+/gi, '$1***')
}
