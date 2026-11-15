import { FieldPath } from 'firebase-admin/firestore'
import { db, toDate } from '@/db'
import { refs, type CompanyDoc, type FinancialStatementDoc, type PriceYearDoc } from '@/db/schema'
import {
  cagrOverYears,
  deriveMetrics,
  liquidCash,
  priceReturns,
  priceToEarnings,
  trailingTwelveMonths,
  yoyGrowth,
  type DerivedMetrics,
  type PriceReturns,
  type QuarterRow,
} from '@/lib/metrics'

/**
 * The single read layer.
 *
 * RSC pages and the JSON route handlers both call these — never their own
 * queries. That is what keeps the web app and the Flutter client on one
 * contract: a field change lands in both surfaces at once instead of drifting
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

/** How many keyword matches to rank in memory. Firestore cannot sort by a
 *  computed relevance, so a bounded candidate set is fetched and ordered here. */
const SEARCH_CANDIDATES = 200

export async function searchCompanies(query: string, limit = 20): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length === 0) return []

  const term = q.toLowerCase().slice(0, 20)
  const snap = await refs
    .companies()
    .where('isActive', '==', true)
    .where('keywords', 'array-contains', term)
    .limit(SEARCH_CANDIDATES)
    .get()

  const upper = q.toUpperCase()
  // Exact ticker first, then ticker prefix, then name prefix, then the rest —
  // each by size. Typing "V" must surface Visa, not every company with a "v".
  const rank = (c: CompanyDoc) =>
    c.symbol === upper
      ? 0
      : c.symbol.startsWith(upper)
        ? 1
        : c.name.toUpperCase().startsWith(upper)
          ? 2
          : 3

  return snap.docs
    .map((d) => d.data() as CompanyDoc)
    .sort((a, b) => rank(a) - rank(b) || (b.marketCap ?? 0) - (a.marketCap ?? 0))
    .slice(0, Math.min(Math.max(limit, 1), 50))
    .map((c) => ({
      symbol: c.symbol,
      name: c.name,
      exchange: c.exchange ?? null,
      sector: c.sector ?? null,
      price: c.quote?.price ?? null,
      marketCap: c.quote?.marketCap ?? null,
    }))
}

export interface StatementRow {
  period: string
  fiscalYear: number
  periodEnd: string
  revenue: number | null
  grossProfit: number | null
  operatingIncome: number | null
  ebitda: number | null
  interestExpense: number | null
  netIncome: number | null
  incomeTax: number | null
  eps: number | null
  epsDiluted: number | null
  sharesDiluted: number | null
  totalAssets: number | null
  totalEquity: number | null
  totalDebt: number | null
  totalCurrentAssets: number | null
  totalCurrentLiabilities: number | null
  cashAndEquivalents: number | null
  shortTermInvestments: number | null
  operatingCashFlow: number | null
  capitalExpenditure: number | null
  freeCashFlow: number | null
}

export function toStatementRow(f: FinancialStatementDoc): StatementRow {
  return {
    period: f.period,
    fiscalYear: f.fiscalYear,
    periodEnd: f.periodEnd,
    revenue: f.revenue ?? null,
    grossProfit: f.grossProfit ?? null,
    operatingIncome: f.operatingIncome ?? null,
    ebitda: f.ebitda ?? null,
    interestExpense: f.interestExpense ?? null,
    netIncome: f.netIncome ?? null,
    incomeTax: f.incomeTax ?? null,
    eps: f.eps ?? null,
    epsDiluted: f.epsDiluted ?? null,
    sharesDiluted: f.sharesDiluted ?? null,
    totalAssets: f.totalAssets ?? null,
    totalEquity: f.totalEquity ?? null,
    totalDebt: f.totalDebt ?? null,
    totalCurrentAssets: f.totalCurrentAssets ?? null,
    totalCurrentLiabilities: f.totalCurrentLiabilities ?? null,
    cashAndEquivalents: f.cashAndEquivalents ?? null,
    shortTermInvestments: f.shortTermInvestments ?? null,
    operatingCashFlow: f.operatingCashFlow ?? null,
    capitalExpenditure: f.capitalExpenditure ?? null,
    freeCashFlow: f.freeCashFlow ?? null,
  }
}

/** Statements newest first — every consumer (charts, CAGR, DCF) expects that order. */
export async function getStatements(
  symbol: string,
  period: 'FY' | 'Q' = 'FY',
  years = 15,
): Promise<StatementRow[]> {
  const snap = await refs
    .financials(symbol)
    .where('isAnnual', '==', period === 'FY')
    .orderBy('periodEnd', 'desc')
    .limit(Math.min(Math.max(years, 1), 40))
    .get()

  return snap.docs.map((d) => toStatementRow(d.data() as FinancialStatementDoc))
}

export interface PriceBarRow {
  tradeDate: string
  close: number
  volume: number | null
}

export async function getPriceSeries(symbol: string, days = 365): Promise<PriceBarRow[]> {
  const from = new Date()
  from.setUTCDate(from.getUTCDate() - Math.min(Math.max(days, 7), 365 * 30))
  const fromIso = from.toISOString().slice(0, 10)

  const firstYear = from.getUTCFullYear()
  const lastYear = new Date().getUTCFullYear()
  const yearRefs = []
  for (let y = firstYear; y <= lastYear; y++) yearRefs.push(refs.priceYear(symbol, y))

  const snaps = await db.getAll(...yearRefs)

  const rows: PriceBarRow[] = []
  for (const snap of snaps) {
    if (!snap.exists) continue
    const { bars } = snap.data() as PriceYearDoc
    for (const [tradeDate, bar] of Object.entries(bars ?? {})) {
      if (tradeDate >= fromIso) rows.push({ tradeDate, close: bar.c, volume: bar.v ?? null })
    }
  }

  // Ascending — a price chart reads left-to-right in time.
  return rows.sort((a, b) => (a.tradeDate < b.tradeDate ? -1 : a.tradeDate > b.tradeDate ? 1 : 0))
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
    nextEarningsDate: string | null
    beta: number | null
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
  /**
   * Which period the ratio metrics describe: trailing twelve months when four
   * consecutive quarters are on file, else the latest fiscal year.
   */
  basis: { kind: 'TTM' | 'FY'; periodEnd: string | null; fiscalYear: number | null }
  metrics: DerivedMetrics & {
    /** Cash + short-term investments, as used for net debt. */
    cash: number | null
    totalDebt: number | null
    peRatio: number | null
    /** Kept under the old names for API compatibility; the real span is `growthYears`. */
    revenueCagr5y: number | null
    revenueYoy: number | null
    netIncomeCagr5y: number | null
    fcfCagr5y: number | null
    /** Fiscal years the CAGR figures actually span (≤ 5). */
    growthYears: number
    priceReturns: PriceReturns
  }
}

/**
 * Everything the detail page and `/api/stocks/:symbol` need, in two reads:
 * the company doc (profile + embedded quote + DCF summary) and the statements.
 */
export async function getStockSnapshot(symbol: string): Promise<StockSnapshot | null> {
  const sym = symbol.toUpperCase()

  const [snap, statements, quarters, prices] = await Promise.all([
    refs.company(sym).get(),
    getStatements(sym, 'FY', 10),
    getStatements(sym, 'Q', 8),
    // 5 years + slack so the 5y return has a bar on or before its start date.
    getPriceSeries(sym, 365 * 5 + 10),
  ])

  if (!snap.exists) return null
  const head = snap.data() as CompanyDoc
  const latest = statements[0] ?? null

  const ttm = trailingTwelveMonths(quarters as QuarterRow[])
  // TTM only when it is at least as recent as the latest annual report —
  // stale quarters must not override a newer 10-K.
  const useTtm = ttm != null && (latest == null || ttm.periodEnd >= latest.periodEnd)
  const base = useTtm ? ttm : latest
  const cash = base ? liquidCash(base.cashAndEquivalents, base.shortTermInvestments) : null

  const empty = {
    revenue: null,
    grossProfit: null,
    operatingIncome: null,
    ebitda: null,
    netIncome: null,
    incomeTax: null,
    totalAssets: null,
    totalEquity: null,
    totalDebt: null,
    totalCurrentAssets: null,
    totalCurrentLiabilities: null,
    operatingCashFlow: null,
    freeCashFlow: null,
    sharesDiluted: null,
  }

  const series = (pick: (s: StatementRow) => number | null) =>
    statements.map((s) => ({ fiscalYear: s.fiscalYear, value: pick(s) }))
  const revenueGrowth = cagrOverYears(series((s) => s.revenue), 5)

  const price = head.quote?.price ?? null

  const metrics = {
    ...deriveMetrics(base ?? empty, cash),
    cash,
    totalDebt: base?.totalDebt ?? null,
    peRatio: priceToEarnings(price, base?.epsDiluted ?? null),
    revenueCagr5y: revenueGrowth.value,
    revenueYoy: yoyGrowth(statements.map((s) => s.revenue)),
    netIncomeCagr5y: cagrOverYears(series((s) => s.netIncome), 5).value,
    fcfCagr5y: cagrOverYears(series((s) => s.freeCashFlow), 5).value,
    growthYears: revenueGrowth.years,
    priceReturns: priceReturns(prices),
  }

  const basis: StockSnapshot['basis'] = useTtm
    ? { kind: 'TTM', periodEnd: ttm.periodEnd, fiscalYear: null }
    : { kind: 'FY', periodEnd: latest?.periodEnd ?? null, fiscalYear: latest?.fiscalYear ?? null }

  const q = head.quote
  const dcf = head.dcf

  return {
    company: {
      symbol: head.symbol,
      name: head.name,
      exchange: head.exchange ?? null,
      currency: head.currency ?? null,
      sector: head.sector ?? null,
      industry: head.industry ?? null,
      country: head.country ?? null,
      website: head.website ?? null,
      description: head.description ?? null,
      employees: head.employees ?? null,
      // A date already passed is stale until the next profile refresh — hide it.
      nextEarningsDate:
        head.nextEarningsDate && head.nextEarningsDate >= new Date().toISOString().slice(0, 10)
          ? head.nextEarningsDate
          : null,
      beta: head.beta ?? null,
    },
    quote:
      !q || (q.price == null && q.marketCap == null)
        ? null
        : {
            price: q.price ?? null,
            previousClose: q.previousClose ?? null,
            dayChangePct: q.dayChangePct ?? null,
            marketCap: q.marketCap ?? null,
            sharesOutstanding: q.sharesOutstanding ?? null,
            // `/stable/quote` no longer carries P/E; fall back to our own.
            peRatio: q.peRatio ?? metrics.peRatio,
            yearHigh: q.yearHigh ?? null,
            yearLow: q.yearLow ?? null,
            asOf: toDate(q.asOf)?.toISOString() ?? null,
          },
    valuation: dcf
      ? {
          fairValuePerShare: dcf.fairValuePerShare ?? null,
          marginOfSafetyPct: dcf.marginOfSafetyPct ?? null,
          impliedGrowthRate: dcf.impliedGrowthRate ?? null,
          computedAt: toDate(dcf.computedAt)?.toISOString() ?? new Date(0).toISOString(),
        }
      : null,
    latest,
    basis,
    metrics,
  }
}

/** Compare view. Each snapshot is independent, so they are fetched in parallel. */
export async function getSnapshots(symbols: string[]): Promise<StockSnapshot[]> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 4)
  const results = await Promise.all(unique.map((s) => getStockSnapshot(s)))
  return results.filter((r): r is StockSnapshot => r !== null)
}

/** Landing page list — the largest companies we cover. */
export async function getCoveredCompanies(limit = 30) {
  const snap = await refs
    .companies()
    .where('isActive', '==', true)
    .orderBy('marketCap', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map((d) => {
    const c = d.data() as CompanyDoc
    return {
      symbol: c.symbol,
      name: c.name,
      sector: c.sector ?? null,
      price: c.quote?.price ?? null,
      dayChangePct: c.quote?.dayChangePct ?? null,
      marketCap: c.quote?.marketCap ?? null,
      fairValuePerShare: c.dcf?.fairValuePerShare ?? null,
      marginOfSafetyPct: c.dcf?.marginOfSafetyPct ?? null,
    }
  })
}

/** Used by `generateStaticParams` and by the compare picker. */
export async function listActiveSymbols(limit = 500): Promise<string[]> {
  const snap = await refs
    .companies()
    .where('isActive', '==', true)
    .orderBy(FieldPath.documentId())
    .limit(limit)
    .select()
    .get()
  return snap.docs.map((d) => d.id)
}

/** Just the quote, for callers that already have statements in hand. */
export async function getQuote(symbol: string) {
  const snap = await refs.company(symbol).get()
  const q = snap.exists ? (snap.data() as CompanyDoc).quote : null
  if (!q) return null

  return {
    price: q.price ?? null,
    sharesOutstanding: q.sharesOutstanding ?? null,
    marketCap: q.marketCap ?? null,
    asOf: toDate(q.asOf),
  }
}

/**
 * Everything `deriveDcfInputs` needs, for callers that are not the detail page
 * (which already holds these from the snapshot): annual and quarterly rows,
 * the quote and the profile beta.
 */
export async function getValuationContext(symbol: string) {
  const [snap, annual, quarters] = await Promise.all([
    refs.company(symbol).get(),
    getStatements(symbol, 'FY', 10),
    getStatements(symbol, 'Q', 8),
  ])
  if (!snap.exists) return null
  const c = snap.data() as CompanyDoc
  const q = c.quote
  return {
    annual,
    quarters,
    beta: c.beta ?? null,
    quote: q
      ? { price: q.price ?? null, sharesOutstanding: q.sharesOutstanding ?? null, marketCap: q.marketCap ?? null }
      : null,
  }
}

export async function symbolsExist(symbols: string[]): Promise<Set<string>> {
  if (symbols.length === 0) return new Set()
  const snaps = await db.getAll(...symbols.map((s) => refs.company(s)), { fieldMask: ['symbol'] })
  return new Set(snaps.filter((s) => s.exists).map((s) => s.id))
}
