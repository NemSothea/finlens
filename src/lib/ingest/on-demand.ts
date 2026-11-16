import { FieldValue } from 'firebase-admin/firestore'
import { db } from '@/db'
import { buildKeywords, refs, type CompanyDoc } from '@/db/schema'
import { getSecProfile, isListed, lookupSymbol } from '@/lib/providers/sec-directory'
import { runStages } from './pipeline'

/**
 * Load a company the first time someone opens it.
 *
 * The covered universe is no longer a list someone ingests in advance: any
 * US-listed company SEC knows about can be opened, and the first visit pulls
 * its profile and statements from SEC (free) and its quote and price history
 * from the market-data vendor (about three calls).
 *
 * Guard rails, because a URL is all it takes to trigger vendor calls:
 *   - only tickers in SEC's directory, on a listed exchange, are loaded;
 *   - a daily budget (ON_DEMAND_DAILY_LIMIT, default 40) caps new loads, so a
 *     crawler walking /stocks/AAAA…ZZZZ cannot drain the vendor quota;
 *   - concurrent visits to the same new ticker share one load.
 */

export type CoverageResult =
  | { status: 'ready' }
  | { status: 'unknown' }
  | { status: 'unlisted'; exchange: string | null }
  | { status: 'budget'; limit: number }
  | { status: 'failed'; reason: string }

const inflight = new Map<string, Promise<CoverageResult>>()

export function onDemandLimit(): number {
  const n = Number(process.env.ON_DEMAND_DAILY_LIMIT ?? 40)
  return Number.isFinite(n) && n >= 0 ? n : 40
}

/** Claim one unit of today's budget. False when it is spent. */
async function claimBudget(limit: number): Promise<boolean> {
  const ref = refs.usage(`onDemand_${new Date().toISOString().slice(0, 10)}`)
  return db.runTransaction(async (tx) => {
    const used = ((await tx.get(ref)).data()?.count as number | undefined) ?? 0
    if (used >= limit) return false
    tx.set(ref, { count: FieldValue.increment(1), updatedAt: new Date() }, { merge: true })
    return true
  })
}

async function isCovered(symbol: string): Promise<boolean> {
  const doc = await refs.company(symbol).get()
  if (!doc.exists) return false
  const c = doc.data() as CompanyDoc
  // A company doc alone is not coverage: a load that died after the profile
  // left no statements, and the next visit should finish it.
  if (!c.isActive) return false
  const anyStatement = await refs.financials(symbol).limit(1).select().get()
  return !anyStatement.empty
}

async function load(symbol: string): Promise<CoverageResult> {
  if (await isCovered(symbol)) return { status: 'ready' }

  const entry = await lookupSymbol(symbol)
  if (!entry) return { status: 'unknown' }

  const profile = await getSecProfile(symbol, entry.cik)
  const exchange = profile.exchange ?? entry.exchange
  if (!isListed(exchange)) return { status: 'unlisted', exchange }

  const limit = onDemandLimit()
  if (!(await claimBudget(limit))) return { status: 'budget', limit }

  await refs.company(symbol).set(
    {
      ...profile,
      exchange,
      symbol: profile.symbol,
      profileSource: 'sec',
      isActive: true,
      keywords: buildKeywords(profile.symbol, profile.name),
      marketCap: 0,
      updatedAt: new Date(),
    } satisfies Partial<CompanyDoc>,
    { merge: true },
  )

  const summaries = await runStages({
    stages: ['financials', 'quotes', 'prices', 'valuations'],
    symbols: [symbol],
  })

  if (await isCovered(symbol)) return { status: 'ready' }
  const failed = summaries.find((s) => s.status !== 'ok')
  return { status: 'failed', reason: failed?.fatal ?? `${failed?.stage ?? 'ingest'} returned no data` }
}

export function ensureCovered(symbol: string): Promise<CoverageResult> {
  const sym = symbol.trim().toUpperCase()
  const running = inflight.get(sym)
  if (running) return running

  const job = load(sym)
    .catch((error: Error): CoverageResult => ({ status: 'failed', reason: error.message }))
    .finally(() => inflight.delete(sym))
  inflight.set(sym, job)
  return job
}
