import { db } from '@/db'
import { companies, financialStatements, priceHistory, quotes, valuations } from '@/db/schema'
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm'
import { cagr, deriveMetrics, yoyGrowth, type DerivedMetrics } from '@/lib/metrics'

/**
 * The single read layer.
 *
 * RSC pages and the JSON route handlers both call these — never their own
 * queries. That is what keeps the web app and the Flutter client on one
 * contract: a column change lands in both surfaces at once instead of drifting
 * until someone notices two different numbers for the same company.
 *
 * Nothing here touches a vendor API. Ever.
 */

export interface SearchResult {
  symbol: string
  name: string
  exchange: string | null
  sector: string | null
  price: number | null
  marketCap: number | null
}

export async function searchCompanies(query: string, limit = 20): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length === 0) return []

  const pattern = `%${q}%`

  const rows = await db
    .select({
      symbol: companies.symbol,
      name: companies.name,
      exchange: companies.exchange,
      sector: companies.sector,
      price: quotes.price,
      marketCap: quotes.marketCap,
    })
    .from(companies)
    .leftJoin(quotes, eq(quotes.symbol, companies.symbol))
    .where(
      and(
        eq(companies.isActive, true),
        or(ilike(companies.symbol, pattern), ilike(companies.name, pattern)),
      ),
    )
    // Exact ticker first, then prefix, then everything else by size. Typing
    // "V" must surface Visa, not the 40 companies with a "v" in their name.
    .orderBy(
      sql`CASE
            WHEN upper(${companies.symbol}) = upper(${q}) THEN 0
            WHEN upper(${companies.symbol}) LIKE upper(${q + '%'}) THEN 1
            WHEN upper(${companies.name}) LIKE upper(${q + '%'}) THEN 2
            ELSE 3
          END`,
      desc(sql`coalesce(${quotes.marketCap}, 0)`),
    )
    .limit(Math.min(Math.max(limit, 1), 50))

  return rows
}

export interface StatementRow {
  period: string
  fiscalYear: number
  periodEnd: string
  revenue: number | null
  grossProfit: number | null
  operatingIncome: number | null
  ebitda: number | null
  netIncome: number | null
  eps: number | null
  epsDiluted: number | null
  sharesDiluted: number | null
  totalAssets: number | null
  totalEquity: number | null
  totalDebt: number | null
  totalCurrentAssets: number | null
  totalCurrentLiabilities: number | null
  cashAndEquivalents: number | null
  operatingCashFlow: number | null
  capitalExpenditure: number | null
  freeCashFlow: number | null
}

/** Statements newest first — every consumer (charts, CAGR, DCF) expects that order. */
export async function getStatements(
  symbol: string,
  period: 'FY' | 'Q' = 'FY',
  years = 15,
): Promise<StatementRow[]> {
  const rows = await db
    .select({
      period: financialStatements.period,
      fiscalYear: financialStatements.fiscalYear,
      periodEnd: financialStatements.periodEnd,
      revenue: financialStatements.revenue,
      grossProfit: financialStatements.grossProfit,
      operatingIncome: financialStatements.operatingIncome,
      ebitda: financialStatements.ebitda,
      netIncome: financialStatements.netIncome,
      eps: financialStatements.eps,
      epsDiluted: financialStatements.epsDiluted,
      sharesDiluted: financialStatements.sharesDiluted,
      totalAssets: financialStatements.totalAssets,
      totalEquity: financialStatements.totalEquity,
      totalDebt: financialStatements.totalDebt,
      totalCurrentAssets: financialStatements.totalCurrentAssets,
      totalCurrentLiabilities: financialStatements.totalCurrentLiabilities,
      cashAndEquivalents: financialStatements.cashAndEquivalents,
      operatingCashFlow: financialStatements.operatingCashFlow,
      capitalExpenditure: financialStatements.capitalExpenditure,
      freeCashFlow: financialStatements.freeCashFlow,
    })
    .from(financialStatements)
    .where(
      and(
        eq(financialStatements.symbol, symbol.toUpperCase()),
        period === 'FY'
          ? eq(financialStatements.period, 'FY')
          : sql`${financialStatements.period} <> 'FY'`,
      ),
    )
    .orderBy(desc(financialStatements.periodEnd))
    .limit(Math.min(Math.max(years, 1), 40))

  return rows
}

export interface PriceBarRow {
  tradeDate: string
  close: number
  volume: number | null
}

export async function getPriceSeries(symbol: string, days = 365): Promise<PriceBarRow[]> {
  const from = new Date()
  from.setUTCDate(from.getUTCDate() - Math.min(Math.max(days, 7), 365 * 30))

  const rows = await db
    .select({
      tradeDate: priceHistory.tradeDate,
      close: priceHistory.close,
      volume: priceHistory.volume,
    })
    .from(priceHistory)
    .where(
      and(
        eq(priceHistory.symbol, symbol.toUpperCase()),
        gte(priceHistory.tradeDate, from.toISOString().slice(0, 10)),
      ),
    )
    // Ascending — a price chart reads left-to-right in time.
    .orderBy(asc(priceHistory.tradeDate))

  return rows
}

export interface StockSnapshot {
  company: {
    symbol: string
    name: string
    exchange: string | null
    currency: string | null
    sector: string | null
    industry: string | null
    country: string | null
    website: string | null
    description: string | null
    employees: number | null
  }
  quote: {
    price: number | null
    previousClose: number | null
    dayChangePct: number | null
    marketCap: number | null
    sharesOutstanding: number | null
    peRatio: number | null
    yearHigh: number | null
    yearLow: number | null
    asOf: string | null
  } | null
  valuation: {
    fairValuePerShare: number | null
    marginOfSafetyPct: number | null
    impliedGrowthRate: number | null
    computedAt: string
  } | null
  latest: StatementRow | null
  metrics: DerivedMetrics & {
    revenueCagr5y: number | null
    revenueYoy: number | null
    netIncomeCagr5y: number | null
    fcfCagr5y: number | null
  }
}

/**
 * Everything the detail page and `/api/stocks/:symbol` need, in three queries.
 *
 * Deliberately not one big join: the statements query returns many rows per
 * company and joining it against the single-row profile/quote/valuation tables
 * would multiply those columns across every statement row for no benefit.
 */
export async function getStockSnapshot(symbol: string): Promise<StockSnapshot | null> {
  const sym = symbol.toUpperCase()

  const [head] = await db
    .select({
      symbol: companies.symbol,
      name: companies.name,
      exchange: companies.exchange,
      currency: companies.currency,
      sector: companies.sector,
      industry: companies.industry,
      country: companies.country,
      website: companies.website,
      description: companies.description,
      employees: companies.employees,

      price: quotes.price,
      previousClose: quotes.previousClose,
      dayChangePct: quotes.dayChangePct,
      marketCap: quotes.marketCap,
      sharesOutstanding: quotes.sharesOutstanding,
      peRatio: quotes.peRatio,
      yearHigh: quotes.yearHigh,
      yearLow: quotes.yearLow,
      quoteAsOf: quotes.asOf,

      fairValuePerShare: valuations.fairValuePerShare,
      marginOfSafetyPct: valuations.marginOfSafetyPct,
      impliedGrowthRate: valuations.impliedGrowthRate,
      valuationComputedAt: valuations.computedAt,
    })
    .from(companies)
    .leftJoin(quotes, eq(quotes.symbol, companies.symbol))
    .leftJoin(
      valuations,
      and(eq(valuations.symbol, companies.symbol), eq(valuations.method, 'dcf')),
    )
    .where(eq(companies.symbol, sym))
    .limit(1)

  if (!head) return null

  const statements = await getStatements(sym, 'FY', 10)
  const latest = statements[0] ?? null

  const metrics = {
    ...deriveMetrics(
      latest ?? {
        revenue: null,
        grossProfit: null,
        operatingIncome: null,
        ebitda: null,
        netIncome: null,
        totalAssets: null,
        totalEquity: null,
        totalDebt: null,
        totalCurrentAssets: null,
        totalCurrentLiabilities: null,
        operatingCashFlow: null,
        freeCashFlow: null,
        sharesDiluted: null,
      },
      latest?.cashAndEquivalents,
    ),
    revenueCagr5y: cagr(statements.slice(0, 6).map((s) => s.revenue)),
    revenueYoy: yoyGrowth(statements.map((s) => s.revenue)),
    netIncomeCagr5y: cagr(statements.slice(0, 6).map((s) => s.netIncome)),
    fcfCagr5y: cagr(statements.slice(0, 6).map((s) => s.freeCashFlow)),
  }

  return {
    company: {
      symbol: head.symbol,
      name: head.name,
      exchange: head.exchange,
      currency: head.currency,
      sector: head.sector,
      industry: head.industry,
      country: head.country,
      website: head.website,
      description: head.description,
      employees: head.employees,
    },
    quote: head.price == null && head.marketCap == null
      ? null
      : {
          price: head.price,
          previousClose: head.previousClose,
          dayChangePct: head.dayChangePct,
          marketCap: head.marketCap,
          sharesOutstanding: head.sharesOutstanding,
          peRatio: head.peRatio,
          yearHigh: head.yearHigh,
          yearLow: head.yearLow,
          asOf: head.quoteAsOf?.toISOString() ?? null,
        },
    valuation: head.valuationComputedAt
      ? {
          fairValuePerShare: head.fairValuePerShare,
          marginOfSafetyPct: head.marginOfSafetyPct,
          impliedGrowthRate: head.impliedGrowthRate,
          computedAt: head.valuationComputedAt.toISOString(),
        }
      : null,
    latest,
    metrics,
  }
}

/** Compare view. Sequential-safe but issued in parallel — each snapshot is
 *  independent, and comparing 2 tickers should not cost 2 round-trip waits. */
export async function getSnapshots(symbols: string[]): Promise<StockSnapshot[]> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 4)
  const results = await Promise.all(unique.map((s) => getStockSnapshot(s)))
  return results.filter((r): r is StockSnapshot => r !== null)
}

/** Landing page list — the companies we actually have valuations for. */
export async function getCoveredCompanies(limit = 30) {
  return db
    .select({
      symbol: companies.symbol,
      name: companies.name,
      sector: companies.sector,
      price: quotes.price,
      dayChangePct: quotes.dayChangePct,
      marketCap: quotes.marketCap,
      fairValuePerShare: valuations.fairValuePerShare,
      marginOfSafetyPct: valuations.marginOfSafetyPct,
    })
    .from(companies)
    .leftJoin(quotes, eq(quotes.symbol, companies.symbol))
    .leftJoin(
      valuations,
      and(eq(valuations.symbol, companies.symbol), eq(valuations.method, 'dcf')),
    )
    .where(eq(companies.isActive, true))
    .orderBy(desc(sql`coalesce(${quotes.marketCap}, 0)`))
    .limit(limit)
}

/** Used by `generateStaticParams` and by the compare picker. */
export async function listActiveSymbols(limit = 500): Promise<string[]> {
  const rows = await db
    .select({ symbol: companies.symbol })
    .from(companies)
    .where(eq(companies.isActive, true))
    .orderBy(companies.symbol)
    .limit(limit)
  return rows.map((r) => r.symbol)
}

/** Just the quote, for callers that already have statements in hand. */
export async function getQuote(symbol: string) {
  const [row] = await db
    .select({
      price: quotes.price,
      sharesOutstanding: quotes.sharesOutstanding,
      marketCap: quotes.marketCap,
      asOf: quotes.asOf,
    })
    .from(quotes)
    .where(eq(quotes.symbol, symbol.toUpperCase()))
    .limit(1)

  return row ?? null
}

export async function symbolsExist(symbols: string[]): Promise<Set<string>> {
  if (symbols.length === 0) return new Set()
  const rows = await db
    .select({ symbol: companies.symbol })
    .from(companies)
    .where(inArray(companies.symbol, symbols.map((s) => s.toUpperCase())))
  return new Set(rows.map((r) => r.symbol))
}
