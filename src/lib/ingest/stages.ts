import { db } from '@/db'
import {
  companies,
  financialStatements,
  priceHistory,
  quotes,
  valuations,
} from '@/db/schema'
import { and, desc, eq, inArray, sql as raw } from 'drizzle-orm'
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

/** Resolve which symbols a stage should operate on: explicit list, else the
 *  active universe already in our DB. Never re-derives the universe from the
 *  vendor — that is the `universe` stage's job and it runs weekly, not nightly. */
async function resolveSymbols(opts: StageOptions): Promise<string[]> {
  if (opts.symbols?.length) return opts.symbols

  const rows = await db
    .select({ symbol: companies.symbol })
    .from(companies)
    .where(eq(companies.isActive, true))
    .orderBy(companies.symbol)
    .limit(opts.limit ?? 100_000)

  return rows.map((r) => r.symbol)
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

  for (const batch of chunk(capped, 500)) {
    await db
      .insert(companies)
      .values(
        batch.map((s) => ({
          symbol: s.symbol,
          name: s.name,
          exchange: s.exchange,
          isActive: true,
          updatedAt: new Date(),
        })),
      )
      // Name/exchange only. Do NOT clobber profile fields here — this stage
      // has no profile data and would blank them out on every weekly run.
      .onConflictDoUpdate({
        target: companies.symbol,
        set: {
          name: raw`excluded.name`,
          exchange: raw`excluded.exchange`,
          isActive: true,
          updatedAt: new Date(),
        },
      })
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

  await mapWithConcurrency(symbols, opts.concurrency ?? 4, async (symbol) => {
    try {
      const p = await provider.getProfile(symbol)
      if (!p) {
        ctx.recordFailure(symbol, 'no profile returned')
        return
      }

      await db
        .insert(companies)
        .values({ ...p, isActive: true, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: companies.symbol,
          set: {
            name: p.name,
            exchange: p.exchange,
            currency: p.currency,
            country: p.country,
            sector: p.sector,
            industry: p.industry,
            website: p.website,
            description: p.description,
            ceo: p.ceo,
            employees: p.employees,
            ipoDate: p.ipoDate,
            updatedAt: new Date(),
          },
        })
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

      for (const batch of chunk(annual, 100)) {
        await db
          .insert(financialStatements)
          .values(batch.map((f) => ({ ...f, source: provider.name, ingestedAt: new Date() })))
          // Restatements are normal — re-ingest overwrites the same natural key
          // rather than accumulating duplicate periods.
          .onConflictDoUpdate({
            target: [
              financialStatements.symbol,
              financialStatements.period,
              financialStatements.periodEnd,
            ],
            set: buildExcludedSet([
              'reported_currency',
              'revenue',
              'cost_of_revenue',
              'gross_profit',
              'operating_expenses',
              'operating_income',
              'ebitda',
              'interest_expense',
              'income_tax',
              'net_income',
              'eps',
              'eps_diluted',
              'shares_basic',
              'shares_diluted',
              'cash_and_equivalents',
              'short_term_investments',
              'inventory',
              'total_current_assets',
              'total_assets',
              'total_current_liabilities',
              'short_term_debt',
              'long_term_debt',
              'total_debt',
              'total_liabilities',
              'total_equity',
              'operating_cash_flow',
              'capital_expenditure',
              'free_cash_flow',
              'dividends_paid',
              'share_buybacks',
            ]),
          })
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

  for (const batch of chunk(symbols, 500)) {
    try {
      const fetched = await provider.getQuotes(batch)
      if (fetched.length === 0) continue

      await db
        .insert(quotes)
        .values(fetched.map((q) => ({ ...q, asOf: new Date() })))
        .onConflictDoUpdate({
          target: quotes.symbol,
          set: buildExcludedSet([
            'price',
            'previous_close',
            'day_change_pct',
            'market_cap',
            'shares_outstanding',
            'volume',
            'pe_ratio',
            'year_high',
            'year_low',
            'as_of',
          ]),
        })
      ctx.recordOk(fetched.length)
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
      // Incremental: resume from the newest stored bar, minus a small overlap
      // so late vendor corrections to recent days get picked up.
      const [latest] = await db
        .select({ tradeDate: priceHistory.tradeDate })
        .from(priceHistory)
        .where(eq(priceHistory.symbol, symbol))
        .orderBy(desc(priceHistory.tradeDate))
        .limit(1)

      const from = latest
        ? isoDaysBefore(latest.tradeDate, lookbackDays)
        : isoDaysBefore(todayIso(), 365 * 10)

      const bars = await provider.getDailyPrices(symbol, from)
      if (bars.length === 0) return

      for (const batch of chunk(bars, 1000)) {
        await db
          .insert(priceHistory)
          .values(batch)
          .onConflictDoUpdate({
            target: [priceHistory.symbol, priceHistory.tradeDate],
            set: buildExcludedSet(['open', 'high', 'low', 'close', 'adj_close', 'volume']),
          })
      }
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

  for (const batch of chunk(symbols, 100)) {
    const rows = await db
      .select({
        symbol: financialStatements.symbol,
        periodEnd: financialStatements.periodEnd,
        freeCashFlow: financialStatements.freeCashFlow,
        totalDebt: financialStatements.totalDebt,
        cashAndEquivalents: financialStatements.cashAndEquivalents,
        sharesDiluted: financialStatements.sharesDiluted,
      })
      .from(financialStatements)
      .where(
        and(
          inArray(financialStatements.symbol, batch),
          eq(financialStatements.period, 'FY'),
        ),
      )
      .orderBy(financialStatements.symbol, desc(financialStatements.periodEnd))

    const bySymbol = new Map<string, typeof rows>()
    for (const r of rows) {
      const list = bySymbol.get(r.symbol) ?? []
      list.push(r)
      bySymbol.set(r.symbol, list)
    }

    const quoteRows = await db
      .select({
        symbol: quotes.symbol,
        price: quotes.price,
        sharesOutstanding: quotes.sharesOutstanding,
      })
      .from(quotes)
      .where(inArray(quotes.symbol, batch))

    const quoteBySymbol = new Map(quoteRows.map((q) => [q.symbol, q]))

    for (const [symbol, history] of bySymbol) {
      try {
        const quote = quoteBySymbol.get(symbol) ?? null

        // Same derivation the detail page and the valuation endpoint use.
        // Duplicating it here is how one company ends up with two different
        // fair values depending on which surface you look at.
        const derived = deriveDcfInputs(history, quote)

        // Skip rather than guess. A fair value built on missing inputs is worse
        // than no fair value — users act on these numbers.
        if (!derived.ok) {
          ctx.recordFailure(symbol, describeFailure(derived.reason))
          continue
        }

        const { assumptions } = derived.inputs
        const dcf = calculateDcf(assumptions)
        const mos = quote?.price ? marginOfSafety(dcf.fairValuePerShare, quote.price) : null

        const implied = quote?.price
          ? reverseDcf({ ...assumptions, currentPrice: quote.price })
          : null

        await db
          .insert(valuations)
          .values({
            symbol,
            method: 'dcf',
            fairValuePerShare: dcf.fairValuePerShare,
            marginOfSafetyPct: mos != null && isFinite(mos) ? mos : null,
            impliedGrowthRate: implied?.converged ? implied.impliedGrowthRate : null,
            assumptions,
            computedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [valuations.symbol, valuations.method],
            set: buildExcludedSet([
              'fair_value_per_share',
              'margin_of_safety_pct',
              'implied_growth_rate',
              'assumptions',
              'computed_at',
            ]),
          })

        ctx.recordOk()
      } catch (error) {
        ctx.recordFailure(symbol, error)
      }
    }
  }

  return { symbols: symbols.length }
}

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

/** Build an `ON CONFLICT DO UPDATE SET col = excluded.col` map without spelling
 *  out 30 identical lines per statement. */
function buildExcludedSet(columns: string[]): Record<string, ReturnType<typeof raw>> {
  return Object.fromEntries(
    columns.map((c) => [toCamel(c), raw.raw(`excluded."${c}"`)]),
  ) as Record<string, ReturnType<typeof raw>>
}

function toCamel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoDaysBefore(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}
