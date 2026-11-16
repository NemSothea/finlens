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
import type { FinancialPeriod, MarketDataProvider } from '@/lib/providers/types'
import { chunk, type RunContext } from './runner'
import { calculateDcf, marginOfSafety, reverseDcf } from '@/lib/valuation/dcf'
import { deriveDcfInputs, describeFailure } from '@/lib/valuation/inputs'
import { toStatementRow } from '@/lib/queries/stocks'
import { olderHistory, SecHistorySource } from '@/lib/providers/sec'
import { getSecProfile } from '@/lib/providers/sec-directory'
import { betaFromCloses } from '@/lib/valuation/beta'
import { getPriceSeries } from '@/lib/queries/stocks'

export interface StageOptions {
  provider: MarketDataProvider
  ctx: RunContext
  symbols?: string[]
  limit?: number
  years?: number
  /** Quarterly periods to fetch alongside annual ones (feeds TTM). 0 = skip. */
  quarters?: number
  concurrency?: number
  /** Fills statement periods older than the primary vendor returns. */
  history?: SecHistorySource | null
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
      // SEC first when we know the filer: free, and it leaves the vendor's
      // daily quota for prices. The vendor profile is the fallback, and the
      // way a company's CIK is learned in the first place.
      const known = (await refs.company(symbol).get()).data() as CompanyDoc | undefined
      const useSec = Boolean(opts.history && known?.cik && process.env.PROFILE_SOURCE !== 'fmp')
      const p = useSec
        ? await getSecProfile(symbol, known!.cik!).catch(() => null)
        : await provider.getProfile(symbol)
      if (!p) {
        ctx.recordFailure(symbol, 'no profile returned')
        return
      }
      // SEC has no description, CEO, headcount or beta: never blank out what
      // an earlier vendor profile filled in.
      const fields = Object.fromEntries(
        Object.entries(p).filter(([, v]) => v != null || !useSec),
      ) as Partial<typeof p>
      // A missing earnings date must not fail the profile — it is a nice-to-have.
      const nextEarningsDate = await provider
        .getNextEarningsDate(symbol, new Date().toISOString().slice(0, 10))
        .catch(() => null)

      await refs.company(symbol).set(
        {
          ...fields,
          symbol: p.symbol.toUpperCase(),
          profileSource: useSec ? 'sec' : provider.name,
          ...(!useSec && p.beta != null ? { betaSource: 'vendor' as const } : {}),
          nextEarningsDate,
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
  // Four quarters make one TTM; eight leave room for a missing filing and a
  // year-over-year TTM comparison. The FMP free plan caps this at 5.
  const quarters = opts.quarters ?? Number(process.env.INGEST_QUARTERS ?? 8)
  // How far back SEC history reaches (XBRL starts ~2009, so ~15 years in practice).
  const historyYears = Number(process.env.HISTORY_YEARS ?? 30)

  await mapWithConcurrency(symbols, opts.concurrency ?? 3, async (symbol) => {
    try {
      // SEC filings as the whole statement history when the filer is known:
      // free, official, as fresh as the vendor (the newest 10-Q lands the same
      // day), and one consistent set of definitions across every year.
      const cik = ((await refs.company(symbol).get()).data() as CompanyDoc | undefined)?.cik
      if (opts.history && cik && process.env.FINANCIALS_SOURCE !== 'fmp') {
        const sec = await opts.history.getHistory(symbol, cik).catch((error: Error) => {
          console.warn(`[financials] ${symbol}: SEC unavailable, using ${provider.name} — ${error.message}`)
          return null
        })
        if (sec && sec.annual.length > 0) {
          const rows = [...sec.annual.slice(0, historyYears), ...sec.quarterly.slice(0, historyYears * 4)]
          await replaceStatements(symbol, rows, opts.history.name)
          ctx.recordOk(rows.length)
          return
        }
      }

      const annual = await provider.getAnnualFinancials(symbol, years)
      if (annual.length === 0) {
        ctx.recordFailure(symbol, 'no annual statements returned')
        return
      }
      const quarterly = quarters > 0 ? await provider.getQuarterlyFinancials(symbol, quarters) : []
      const periods = [...annual, ...quarterly].map((f) => ({ ...f, source: provider.name }))

      // Older periods from SEC filings. Best effort: a history failure must
      // not lose the vendor rows already fetched.
      if (opts.history) {
        const cik = ((await refs.company(symbol).get()).data() as CompanyDoc | undefined)?.cik
        if (cik) {
          try {
            const sec = await opts.history.getHistory(symbol, cik)
            for (const f of [
              ...olderHistory(annual, sec.annual, historyYears),
              ...olderHistory(quarterly, sec.quarterly, historyYears * 4),
            ]) {
              periods.push({ ...f, source: opts.history.name })
            }
          } catch (error) {
            console.warn(`[financials] ${symbol}: SEC history skipped — ${(error as Error).message}`)
          }
        }
      }

      for (const batch of chunk(periods, BATCH_SIZE)) {
        const writes = db.batch()
        for (const f of batch) {
          // Doc id is the natural key (period + period end). Restatements are
          // normal — re-ingest overwrites the same doc rather than accumulating
          // duplicate periods.
          const doc: FinancialStatementDoc = {
            ...f,
            symbol: f.symbol.toUpperCase(),
            isAnnual: f.period === 'FY',
            ingestedAt: new Date(),
          }
          writes.set(refs.financial(symbol, f.period, f.periodEnd), doc)
        }
        await writes.commit()
      }
      ctx.recordOk(periods.length)
    } catch (error) {
      ctx.recordFailure(symbol, error)
    }
  })

  return { symbols: symbols.length }
}

/**
 * Write a full statement set and delete the symbol's other statement docs, so
 * a switch of source never leaves two rows for one period (a vendor dating a
 * 52/53-week quarter a day apart would otherwise break the TTM gap check).
 */
async function replaceStatements(symbol: string, rows: FinancialPeriod[], source: string) {
  const keep = new Set(rows.map((f) => refs.financial(symbol, f.period, f.periodEnd).path))
  const stale = (await refs.financials(symbol).select().get()).docs.filter((d) => !keep.has(d.ref.path))

  const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = [
    ...rows.map((f) => (b: FirebaseFirestore.WriteBatch) =>
      b.set(refs.financial(symbol, f.period, f.periodEnd), {
        ...f,
        symbol: f.symbol.toUpperCase(),
        isAnnual: f.period === 'FY',
        source,
        ingestedAt: new Date(),
      } satisfies FinancialStatementDoc),
    ),
    ...stale.map((d) => (b: FirebaseFirestore.WriteBatch) => b.delete(d.ref)),
  ]
  for (const group of chunk(ops, BATCH_SIZE)) {
    const batch = db.batch()
    for (const op of group) op(batch)
    await batch.commit()
  }
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
  let benchmark: Promise<Map<string, number> | null> | undefined

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

      // Beta from our own prices: one method for every company, no vendor
      // dependency. Best effort — a missing benchmark must not fail prices.
      const market = await (benchmark ??= loadBenchmark(provider))
      if (market) {
        const closes = (await getPriceSeries(symbol, 365 * 6)).map((b) => ({ date: b.tradeDate, close: b.close }))
        const beta = betaFromCloses(closes, market)
        if (beta != null) await companyRef.set({ beta, betaSource: 'computed' }, { merge: true })
      }

      ctx.recordOk(bars.length)
    } catch (error) {
      ctx.recordFailure(symbol, error)
    }
  })

  return { symbols: symbols.length }
}

/** The market for beta: SPY month-end closes. */
export const BENCHMARK = 'SPY'

/**
 * SPY month-end closes, refreshed from the vendor at most weekly (one call)
 * and shared by every company's beta.
 */
async function loadBenchmark(provider: MarketDataProvider): Promise<Map<string, number> | null> {
  const ref = refs.benchmark(BENCHMARK)
  const doc = (await ref.get()).data() as { monthly?: Record<string, number>; updatedAt?: { toDate(): Date } } | undefined
  const age = doc?.updatedAt ? Date.now() - doc.updatedAt.toDate().getTime() : Infinity
  if (doc?.monthly && age < 7 * 86_400_000) return new Map(Object.entries(doc.monthly))

  try {
    const bars = await provider.getDailyPrices(BENCHMARK, isoDaysBefore(todayIso(), 365 * 6))
    const monthly: Record<string, number> = {}
    for (const b of [...bars].sort((x, y) => (x.tradeDate < y.tradeDate ? -1 : 1))) {
      if (b.close > 0) monthly[b.tradeDate.slice(0, 7)] = b.close
    }
    if (Object.keys(monthly).length === 0) return null
    await ref.set({ symbol: BENCHMARK, monthly, updatedAt: new Date() })
    return new Map(Object.entries(monthly))
  } catch (error) {
    console.warn(`[prices] benchmark ${BENCHMARK} unavailable — ${(error as Error).message}`)
    return doc?.monthly ? new Map(Object.entries(doc.monthly)) : null
  }
}

/* ------------------------------------------------------------------ *
 * valuations — pure compute, zero vendor calls. Runs after financials/quotes.
 * ------------------------------------------------------------------ */

export async function stageValuations(opts: StageOptions) {
  const { ctx } = opts
  const symbols = await resolveSymbols(opts)

  await mapWithConcurrency(symbols, opts.concurrency ?? 8, async (symbol) => {
    try {
      const [statementsSnap, quartersSnap, companySnap] = await Promise.all([
        refs.financials(symbol).where('isAnnual', '==', true).orderBy('periodEnd', 'desc').limit(10).get(),
        // Five quarters: four for TTM, the fifth for the year-ago debt (FCFE).
        refs.financials(symbol).where('isAnnual', '==', false).orderBy('periodEnd', 'desc').limit(8).get(),
        refs.company(symbol).get(),
      ])

      if (!companySnap.exists || statementsSnap.empty) return

      const history = statementsSnap.docs.map((d) => toStatementRow(d.data() as FinancialStatementDoc))
      const quarters = quartersSnap.docs.map((d) => toStatementRow(d.data() as FinancialStatementDoc))

      const company = companySnap.data() as CompanyDoc
      const q = company.quote
      const quote = q
        ? { price: q.price ?? null, sharesOutstanding: q.sharesOutstanding ?? null, marketCap: q.marketCap ?? null }
        : null

      // Same derivation the detail page and the valuation endpoint use.
      // Duplicating it here is how one company ends up with two different
      // fair values depending on which surface you look at.
      const derived = deriveDcfInputs(history, quote, { quarters, beta: company.beta ?? null })

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
        // Which base and rate produced the number, so the cached value can be
        // explained without re-deriving it.
        assumptions: {
          ...assumptions,
          basis: derived.inputs.defaults.basis,
          flavour: derived.inputs.defaults.flavour,
          wacc: derived.inputs.wacc?.wacc ?? null,
        },
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
