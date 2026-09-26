import { FieldPath } from 'firebase-admin/firestore'
import { db } from '@/db'
import {
  buildKeywords,
  refs,
  type CompanyDoc,
  type FinancialStatementDoc,
  type PriceBarDoc,
  type ValuationDoc,
} from '@/db/schema'
import { mapWithConcurrency } from '@/lib/providers/http'
import type { MarketDataProvider } from '@/lib/providers/types'
import { chunk, type RunContext } from './runner'
import { calculateDcf, marginOfSafety, reverseDcf } from '@/lib/valuation/dcf'
import { deriveDcfInputs, describeFailure } from '@/lib/valuation/inputs'

export interface StageOptions {
  provider: MarketDataProvider
  ctx: RunContext
  symbols?: string[]
  limit?: number
  years?: number
  concurrency?: number
}

/** A Firestore batch holds 500 writes; stay under it with headroom. */
const BATCH_SIZE = 400

/** Resolve which symbols a stage should operate on: explicit list, else the
 *  active universe already in our DB. Never re-derives the universe from the
 *  vendor — that is the `universe` stage's job and it runs weekly, not nightly. */
async function resolveSymbols(opts: StageOptions): Promise<string[]> {
  if (opts.symbols?.length) return opts.symbols

  const snap = await refs
    .companies()
    .where('isActive', '==', true)
    .orderBy(FieldPath.documentId())
    .limit(opts.limit ?? 100_000)
    .select()
    .get()

  return snap.docs.map((d) => d.id)
}

/** Which of these symbols already have a company doc. */
async function existingSymbols(symbols: string[]): Promise<Set<string>> {
  const out = new Set<string>()
  for (const batch of chunk(symbols, 300)) {
    const snaps = await db.getAll(...batch.map((s) => refs.company(s)), { fieldMask: ['symbol'] })
    for (const s of snaps) if (s.exists) out.add(s.id)
  }
  return out
}

/* ------------------------------------------------------------------ *
 * universe — weekly. Defines what we cover.
 * ------------------------------------------------------------------ */

export async function stageUniverse(opts: StageOptions) {
  const { provider, ctx } = opts
  const exchanges = (process.env.INGEST_EXCHANGES ?? 'NASDAQ,NYSE')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  const symbols = await provider.listSymbols(exchanges)
  const capped = opts.limit ? symbols.slice(0, opts.limit) : symbols

  for (const batch of chunk(capped, BATCH_SIZE)) {
    const existing = await existingSymbols(batch.map((s) => s.symbol))
    const writes = db.batch()

    for (const s of batch) {
      // Name/exchange only, merged. Do NOT clobber profile fields, the quote
      // or the DCF summary — this stage has none of them.
      writes.set(
        refs.company(s.symbol),
        {
          symbol: s.symbol.toUpperCase(),
          name: s.name,
          exchange: s.exchange,
          isActive: true,
          keywords: buildKeywords(s.symbol, s.name),
          updatedAt: new Date(),
          // A new company needs a marketCap for the landing-page ordering
          // (Firestore drops docs missing the ordered field). Existing ones
          // keep the value the quotes stage wrote.
          ...(existing.has(s.symbol.toUpperCase()) ? {} : { marketCap: 0 }),
        } satisfies Partial<CompanyDoc>,
        { merge: true },
      )
    }

    await writes.commit()
    ctx.recordOk(batch.length)
  }

  return { discovered: capped.length }
}

/* ------------------------------------------------------------------ *
 * profiles — weekly.
 * ------------------------------------------------------------------ */

export async function stageProfiles(opts: StageOptions) {
  const { provider, ctx } = opts
  const symbols = await resolveSymbols(opts)
  const existing = await existingSymbols(symbols)

  await mapWithConcurrency(symbols, opts.concurrency ?? 4, async (symbol) => {
    try {
      const p = await provider.getProfile(symbol)
      if (!p) {
        ctx.recordFailure(symbol, 'no profile returned')
        return
      }

      await refs.company(symbol).set(
        {
          ...p,
          symbol: p.symbol.toUpperCase(),
          isActive: true,
          keywords: buildKeywords(p.symbol, p.name),
          updatedAt: new Date(),
          ...(existing.has(symbol.toUpperCase()) ? {} : { marketCap: 0 }),
        } satisfies Partial<CompanyDoc>,
        { merge: true },
      )
      ctx.recordOk()
    } catch (error) {
      ctx.recordFailure(symbol, error)
    }
  })

  return { symbols: symbols.length }
}

/* ------------------------------------------------------------------ *
 * financials — quarterly / on earnings. The expensive stage.
 * ------------------------------------------------------------------ */

export async function stageFinancials(opts: StageOptions) {
  const { provider, ctx } = opts
  const symbols = await resolveSymbols(opts)
  const years = opts.years ?? Number(process.env.INGEST_YEARS ?? 30)

  await mapWithConcurrency(symbols, opts.concurrency ?? 3, async (symbol) => {
    try {
      const annual = await provider.getAnnualFinancials(symbol, years)
      if (annual.length === 0) {
        ctx.recordFailure(symbol, 'no annual statements returned')
        return
      }

      for (const batch of chunk(annual, BATCH_SIZE)) {
        const writes = db.batch()
        for (const f of batch) {
          // Doc id is the natural key (period + period end). Restatements are
          // normal — re-ingest overwrites the same doc rather than accumulating
          // duplicate periods.
          const doc: FinancialStatementDoc = {
            ...f,
            symbol: f.symbol.toUpperCase(),
            isAnnual: f.period === 'FY',
            source: provider.name,
            ingestedAt: new Date(),
          }
          writes.set(refs.financial(symbol, f.period, f.periodEnd), doc)
        }
        await writes.commit()
      }
      ctx.recordOk(annual.length)
    } catch (error) {
      ctx.recordFailure(symbol, error)
    }
  })

  return { symbols: symbols.length }
}

/* ------------------------------------------------------------------ *
 * quotes — daily after close. Batched: ~20 vendor calls for 2,000 symbols.
 * ------------------------------------------------------------------ */

export async function stageQuotes(opts: StageOptions) {
  const { provider, ctx } = opts
  const symbols = await resolveSymbols(opts)

  for (const batch of chunk(symbols, BATCH_SIZE)) {
    try {
      const fetched = await provider.getQuotes(batch)
      if (fetched.length === 0) continue

      // A quote for a symbol we do not cover would create a nameless company
      // doc. The old foreign key refused those; this does the same.
      const known = await existingSymbols(fetched.map((q) => q.symbol))
      const writes = db.batch()
      let written = 0

      for (const { symbol, ...q } of fetched) {
        if (!known.has(symbol.toUpperCase())) continue
        writes.set(
          refs.company(symbol),
          {
            quote: { ...q, asOf: new Date() },
            marketCap: q.marketCap ?? 0,
          } satisfies Partial<CompanyDoc>,
          { merge: true },
        )
        written++
      }

      await writes.commit()
      ctx.recordOk(written)
    } catch (error) {
      ctx.recordFailure(`batch:${batch[0]}..${batch[batch.length - 1]}`, error)
    }
  }

  return { symbols: symbols.length }
}

/* ------------------------------------------------------------------ *
 * prices — daily, incremental.
 * ------------------------------------------------------------------ */

export async function stagePrices(opts: StageOptions) {
  const { provider, ctx } = opts
  const symbols = await resolveSymbols(opts)
  const lookbackDays = Number(process.env.INGEST_PRICE_LOOKBACK_DAYS ?? 7)

  await mapWithConcurrency(symbols, opts.concurrency ?? 4, async (symbol) => {
    try {
      const companyRef = refs.company(symbol)
      const company = await companyRef.get()
      if (!company.exists) {
        ctx.recordFailure(symbol, 'not in universe')
        return
      }

      // Incremental: resume from the newest stored bar, minus a small overlap
      // so late vendor corrections to recent days get picked up.
      const latest = (company.data() as CompanyDoc).lastPriceDate ?? null
      const from = latest
        ? isoDaysBefore(latest, lookbackDays)
        : isoDaysBefore(todayIso(), 365 * 10)

      const bars = await provider.getDailyPrices(symbol, from)
      if (bars.length === 0) return

      // Group into one doc per year; a merge on the nested `bars` map adds or
      // overwrites individual days without reading the year doc first.
      const byYear = new Map<number, Record<string, PriceBarDoc>>()
      let newest = latest ?? ''
      for (const b of bars) {
        const year = Number(b.tradeDate.slice(0, 4))
        const days = byYear.get(year) ?? {}
        days[b.tradeDate] = {
          o: b.open,
          h: b.high,
          l: b.low,
          c: b.close,
          ac: b.adjClose,
          v: b.volume,
        }
        byYear.set(year, days)
        if (b.tradeDate > newest) newest = b.tradeDate
      }

      const writes = db.batch()
      for (const [year, days] of byYear) {
        writes.set(
          refs.priceYear(symbol, year),
          { symbol: symbol.toUpperCase(), year, bars: days },
          { merge: true },
        )
      }
      writes.set(companyRef, { lastPriceDate: newest }, { merge: true })
      await writes.commit()

      ctx.recordOk(bars.length)
    } catch (error) {
      ctx.recordFailure(symbol, error)
    }
  })

  return { symbols: symbols.length }
}

/* ------------------------------------------------------------------ *
 * valuations — pure compute, zero vendor calls. Runs after financials/quotes.
 * ------------------------------------------------------------------ */

export async function stageValuations(opts: StageOptions) {
  const { ctx } = opts
  const symbols = await resolveSymbols(opts)

  await mapWithConcurrency(symbols, opts.concurrency ?? 8, async (symbol) => {
    try {
      const [statementsSnap, companySnap] = await Promise.all([
        refs
          .financials(symbol)
          .where('isAnnual', '==', true)
          .orderBy('periodEnd', 'desc')
          .select('periodEnd', 'freeCashFlow', 'totalDebt', 'cashAndEquivalents', 'sharesDiluted')
          .get(),
        refs.company(symbol).get(),
      ])

      if (!companySnap.exists || statementsSnap.empty) return

      const history = statementsSnap.docs.map((d) => {
        const f = d.data() as FinancialStatementDoc
        return {
          periodEnd: f.periodEnd,
          freeCashFlow: f.freeCashFlow ?? null,
          totalDebt: f.totalDebt ?? null,
          cashAndEquivalents: f.cashAndEquivalents ?? null,
          sharesDiluted: f.sharesDiluted ?? null,
        }
      })

      const q = (companySnap.data() as CompanyDoc).quote
      const quote = q ? { price: q.price ?? null, sharesOutstanding: q.sharesOutstanding ?? null } : null

      // Same derivation the detail page and the valuation endpoint use.
      // Duplicating it here is how one company ends up with two different
      // fair values depending on which surface you look at.
      const derived = deriveDcfInputs(history, quote)

      // Skip rather than guess. A fair value built on missing inputs is worse
      // than no fair value — users act on these numbers.
      if (!derived.ok) {
        ctx.recordFailure(symbol, describeFailure(derived.reason))
        return
      }

      const { assumptions } = derived.inputs
      const dcf = calculateDcf(assumptions)
      const mos = quote?.price ? marginOfSafety(dcf.fairValuePerShare, quote.price) : null
      const implied = quote?.price ? reverseDcf({ ...assumptions, currentPrice: quote.price }) : null
      const computedAt = new Date()

      const valuation: ValuationDoc = {
        symbol: symbol.toUpperCase(),
        method: 'dcf',
        fairValuePerShare: dcf.fairValuePerShare,
        marginOfSafetyPct: mos != null && isFinite(mos) ? mos : null,
        impliedGrowthRate: implied?.converged ? implied.impliedGrowthRate : null,
        assumptions,
        computedAt,
      }

      const writes = db.batch()
      writes.set(refs.valuation(symbol, 'dcf'), valuation)
      writes.set(
        refs.company(symbol),
        {
          dcf: {
            fairValuePerShare: valuation.fairValuePerShare,
            marginOfSafetyPct: valuation.marginOfSafetyPct,
            impliedGrowthRate: valuation.impliedGrowthRate,
            computedAt,
          },
        } satisfies Partial<CompanyDoc>,
        { merge: true },
      )
      await writes.commit()

      ctx.recordOk()
    } catch (error) {
      ctx.recordFailure(symbol, error)
    }
  })

  return { symbols: symbols.length }
}

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoDaysBefore(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}
