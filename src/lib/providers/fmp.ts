import { z } from 'zod'
import { fetchJson, RateLimiter } from './http'
import {
  ProviderError,
  type CompanyProfile,
  type FinancialPeriod,
  type MarketDataProvider,
  type PriceBar,
  type Quote,
  type SymbolRef,
} from './types'

// FMP retired `/api/v3` for subscriptions opened after Aug 2025. `/stable` takes
// the symbol as a query parameter and renames several fields (noted below).
const BASE = 'https://financialmodelingprep.com/stable'

/**
 * Vendor payloads are validated, never trusted. Data vendors rename fields,
 * return `[]` instead of a 404, and occasionally serve strings where numbers
 * belong. Unvalidated ingest writes that corruption straight into Postgres
 * where it surfaces months later as a wrong fair value.
 *
 * `.catch(null)` per field: one missing line item must degrade that field,
 * not reject the whole company.
 */
const num = z.coerce.number().nullable().catch(null)
const str = z.coerce.string().nullable().catch(null)

const symbolSchema = z.object({
  symbol: z.string(),
  name: str.optional(),
  companyName: str.optional(),
  exchangeShortName: str.optional(),
  exchange: str.optional(),
  type: str.optional(),
})

const profileSchema = z.object({
  symbol: z.string(),
  companyName: str,
  exchange: str, // v3: exchangeShortName
  currency: str,
  country: str,
  sector: str,
  industry: str,
  website: str,
  description: str,
  ceo: str,
  fullTimeEmployees: str,
  ipoDate: str,
})

const incomeSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  fiscalYear: str, // v3: calendarYear
  period: str,
  reportedCurrency: str,
  revenue: num,
  costOfRevenue: num,
  grossProfit: num,
  operatingExpenses: num,
  operatingIncome: num,
  ebitda: num,
  interestExpense: num,
  incomeTaxExpense: num,
  netIncome: num,
  eps: num,
  epsDiluted: num, // v3: epsdiluted
  weightedAverageShsOut: num,
  weightedAverageShsOutDil: num,
})

const balanceSchema = z.object({
  date: z.string(),
  period: str,
  cashAndCashEquivalents: num,
  shortTermInvestments: num,
  inventory: num,
  totalCurrentAssets: num,
  totalAssets: num,
  totalCurrentLiabilities: num,
  shortTermDebt: num,
  longTermDebt: num,
  totalDebt: num,
  totalLiabilities: num,
  totalStockholdersEquity: num,
})

const cashflowSchema = z.object({
  date: z.string(),
  period: str,
  operatingCashFlow: num,
  capitalExpenditure: num,
  freeCashFlow: num,
  commonDividendsPaid: num.optional(), // v3: dividendsPaid
  netDividendsPaid: num.optional(),
  commonStockRepurchased: num,
})

const quoteSchema = z.object({
  symbol: z.string(),
  price: num,
  previousClose: num,
  changePercentage: num, // v3: changesPercentage
  marketCap: num,
  // `/stable/quote` dropped sharesOutstanding and pe. Shares are derived from
  // marketCap ÷ price below; P/E is computed from statements, not trusted from
  // the vendor.
  volume: num,
  yearHigh: num,
  yearLow: num,
})

const earningsSchema = z.object({
  date: z.string(),
  epsActual: num,
})

const barSchema = z.object({
  date: z.string(),
  open: num,
  high: num,
  low: num,
  close: z.coerce.number(),
  volume: num,
})

export interface FmpOptions {
  apiKey?: string
  /** Sustained requests/second. FMP starter tier ~ 5/s; free tier much lower. */
  requestsPerSecond?: number
  onVendorCall?: () => void
}

export class FmpProvider implements MarketDataProvider {
  readonly name = 'fmp'
  private readonly apiKey: string
  private readonly limiter: RateLimiter
  private readonly onVendorCall?: () => void

  constructor(opts: FmpOptions = {}) {
    const apiKey = opts.apiKey ?? process.env.FMP_API_KEY
    if (!apiKey) {
      throw new ProviderError('FMP_API_KEY is not set. Add it to .env.local.')
    }
    this.apiKey = apiKey
    const rps = opts.requestsPerSecond ?? Number(process.env.FMP_REQUESTS_PER_SECOND ?? 4)
    this.limiter = new RateLimiter(Math.max(1, Math.ceil(rps)), rps)
    this.onVendorCall = opts.onVendorCall
  }

  private url(path: string, params: Record<string, string | number | undefined> = {}) {
    const u = new URL(`${BASE}${path}`)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) u.searchParams.set(k, String(v))
    }
    u.searchParams.set('apikey', this.apiKey)
    return u.toString()
  }

  private get<T>(path: string, params?: Record<string, string | number | undefined>) {
    return fetchJson<T>(this.url(path, params), {
      limiter: this.limiter,
      onAttempt: this.onVendorCall,
    })
  }

  async listSymbols(exchanges: string[]): Promise<SymbolRef[]> {
    // Restricted on the free plan (HTTP 402) — ingest with --symbols there.
    const raw = await this.get<unknown[]>('/stock-list')
    const wanted = new Set(exchanges.map((e) => e.toUpperCase()))

    return raw
      .map((r) => symbolSchema.safeParse(r))
      .filter((p) => p.success)
      .map((p) => p.data)
      .filter((s) => {
        const ex = (s.exchangeShortName ?? s.exchange ?? '').toUpperCase()
        // Exclude funds/ETFs — fundamentals-driven analysis is meaningless for them.
        const isEquity = !s.type || s.type.toLowerCase() === 'stock'
        return isEquity && (wanted.size === 0 || wanted.has(ex))
      })
      .map((s) => ({
        symbol: s.symbol,
        name: s.companyName ?? s.name ?? s.symbol,
        exchange: s.exchangeShortName ?? s.exchange ?? null,
      }))
  }

  async getProfile(symbol: string): Promise<CompanyProfile | null> {
    const raw = await this.get<unknown[]>('/profile', { symbol })
    const first = Array.isArray(raw) ? raw[0] : null
    if (!first) return null

    const parsed = profileSchema.safeParse(first)
    if (!parsed.success) return null
    const p = parsed.data

    return {
      symbol: p.symbol,
      name: p.companyName ?? p.symbol,
      exchange: p.exchange,
      currency: p.currency,
      country: p.country,
      sector: p.sector,
      industry: p.industry,
      website: p.website,
      description: p.description,
      ceo: p.ceo,
      employees: p.fullTimeEmployees ? Number(p.fullTimeEmployees.replace(/\D/g, '')) || null : null,
      ipoDate: p.ipoDate,
    }
  }

  async getAnnualFinancials(symbol: string, limit: number): Promise<FinancialPeriod[]> {
    return this.getFinancials(symbol, limit, 'annual')
  }

  async getQuarterlyFinancials(symbol: string, limit: number): Promise<FinancialPeriod[]> {
    return this.getFinancials(symbol, limit, 'quarter')
  }

  /**
   * Three endpoints, joined on report date. The join is the whole reason this
   * lives behind the provider interface: other vendors return one merged
   * document, and callers should not know or care which shape arrived.
   */
  private async getFinancials(
    symbol: string,
    limit: number,
    period: 'annual' | 'quarter',
  ): Promise<FinancialPeriod[]> {
    const params = { symbol, limit, period }

    const [incomeRaw, balanceRaw, cashRaw] = await Promise.all([
      this.get<unknown[]>('/income-statement', params),
      this.get<unknown[]>('/balance-sheet-statement', params),
      this.get<unknown[]>('/cash-flow-statement', params),
    ])

    const byDate = <T extends { date: string }>(rows: unknown[], schema: z.ZodType<T>) => {
      const map = new Map<string, T>()
      for (const row of rows ?? []) {
        const parsed = schema.safeParse(row)
        if (parsed.success) map.set(parsed.data.date, parsed.data)
      }
      return map
    }

    const balances = byDate(balanceRaw, balanceSchema)
    const cashflows = byDate(cashRaw, cashflowSchema)

    const out: FinancialPeriod[] = []

    for (const row of incomeRaw ?? []) {
      const parsed = incomeSchema.safeParse(row)
      if (!parsed.success) continue
      const i = parsed.data
      const b = balances.get(i.date)
      const c = cashflows.get(i.date)

      // Derive FCF when the vendor omits it — it is the single most important
      // input to the valuation engine, so never let it be silently null.
      const freeCashFlow =
        c?.freeCashFlow ??
        (c?.operatingCashFlow != null && c?.capitalExpenditure != null
          ? c.operatingCashFlow + c.capitalExpenditure // capex arrives negative
          : null)

      out.push({
        symbol: i.symbol,
        period: normalisePeriod(i.period, period),
        fiscalYear: Number(i.fiscalYear ?? i.date.slice(0, 4)),
        periodEnd: i.date,
        reportedCurrency: i.reportedCurrency,

        revenue: i.revenue,
        costOfRevenue: i.costOfRevenue,
        grossProfit: i.grossProfit,
        operatingExpenses: i.operatingExpenses,
        operatingIncome: i.operatingIncome,
        ebitda: i.ebitda,
        interestExpense: i.interestExpense,
        incomeTax: i.incomeTaxExpense,
        netIncome: i.netIncome,
        eps: i.eps,
        epsDiluted: i.epsDiluted,
        sharesBasic: i.weightedAverageShsOut,
        sharesDiluted: i.weightedAverageShsOutDil,

        cashAndEquivalents: b?.cashAndCashEquivalents ?? null,
        shortTermInvestments: b?.shortTermInvestments ?? null,
        inventory: b?.inventory ?? null,
        totalCurrentAssets: b?.totalCurrentAssets ?? null,
        totalAssets: b?.totalAssets ?? null,
        totalCurrentLiabilities: b?.totalCurrentLiabilities ?? null,
        shortTermDebt: b?.shortTermDebt ?? null,
        longTermDebt: b?.longTermDebt ?? null,
        totalDebt: b?.totalDebt ?? null,
        totalLiabilities: b?.totalLiabilities ?? null,
        totalEquity: b?.totalStockholdersEquity ?? null,

        operatingCashFlow: c?.operatingCashFlow ?? null,
        capitalExpenditure: c?.capitalExpenditure ?? null,
        freeCashFlow,
        dividendsPaid: c?.commonDividendsPaid ?? c?.netDividendsPaid ?? null,
        shareBuybacks: c?.commonStockRepurchased ?? null,
      })
    }

    return out
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return []

    // One call per chunk, not per symbol — quotes are the highest-frequency
    // stage and batching is the difference between 20 calls and 2,000.
    // `batch-quote` is a paid endpoint; on the free plan it answers 402 and we
    // fall back to one `/quote` call per symbol.
    const CHUNK = 100
    const raw: unknown[] = []
    let batched = true
    for (let i = 0; i < symbols.length; i += CHUNK) {
      const chunk = symbols.slice(i, i + CHUNK)
      if (batched) {
        try {
          raw.push(...((await this.get<unknown[]>('/batch-quote', { symbols: chunk.join(',') })) ?? []))
          continue
        } catch (error) {
          if (!(error instanceof ProviderError && error.status === 402)) throw error
          batched = false
        }
      }
      for (const symbol of chunk) {
        raw.push(...((await this.get<unknown[]>('/quote', { symbol })) ?? []))
      }
    }

    const results: Quote[] = []
    for (const row of raw) {
      const parsed = quoteSchema.safeParse(row)
      if (!parsed.success) continue
      const q = parsed.data
      results.push({
        symbol: q.symbol,
        price: q.price,
        previousClose: q.previousClose,
        dayChangePct: q.changePercentage,
        marketCap: q.marketCap,
        sharesOutstanding:
          q.marketCap != null && q.price != null && q.price > 0 ? q.marketCap / q.price : null,
        volume: q.volume,
        peRatio: null,
        yearHigh: q.yearHigh,
        yearLow: q.yearLow,
      })
    }
    return results
  }

  async getNextEarningsDate(symbol: string, today: string): Promise<string | null> {
    // Per-symbol endpoint: the market-wide calendar is truncated on the free plan.
    const raw = await this.get<unknown[]>('/earnings', { symbol, limit: 5 })
    return pickNextEarningsDate(raw ?? [], today)
  }

  async getDailyPrices(symbol: string, from: string): Promise<PriceBar[]> {
    // `/stable` returns a flat array (v3 wrapped it in `{ historical }`).
    // Closes are split-adjusted; dividend adjustment is a separate paid-tier
    // call, so adjClose stays null rather than being faked from close.
    const raw = await this.get<unknown[]>('/historical-price-eod/full', { symbol, from })
    return (raw ?? [])
      .map((r) => barSchema.safeParse(r))
      .filter((p) => p.success)
      .map((p) => ({
        symbol,
        tradeDate: p.data.date,
        open: p.data.open,
        high: p.data.high,
        low: p.data.low,
        close: p.data.close,
        adjClose: null,
        volume: p.data.volume,
      }))
  }
}

/**
 * Earliest date on or after `today` that has no reported EPS yet. Rows arrive
 * newest first and mix past and scheduled reports, so filter rather than take [0].
 */
export function pickNextEarningsDate(raw: unknown[], today: string): string | null {
  const upcoming = raw
    .map((r) => earningsSchema.safeParse(r))
    .filter((p) => p.success)
    .map((p) => p.data)
    .filter((e) => e.date >= today && e.epsActual == null)
    .map((e) => e.date.slice(0, 10))
    .sort()
  return upcoming[0] ?? null
}

function normalisePeriod(vendorPeriod: string | null, requested: 'annual' | 'quarter'): string {
  if (requested === 'annual') return 'FY'
  const p = (vendorPeriod ?? '').toUpperCase()
  return /^Q[1-4]$/.test(p) ? p : 'Q?'
}
