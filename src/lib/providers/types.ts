/**
 * Vendor-agnostic market data contract.
 *
 * Nothing outside `src/lib/providers/` may import a vendor SDK or hit a vendor
 * URL. Every ingest stage talks to this interface only, so swapping FMP for
 * EODHD (or adding a second vendor as a fallback) is a one-file change instead
 * of a rewrite. Vendor lock-in is the most expensive mistake available here —
 * the data feed is the single largest recurring cost and the most likely thing
 * to change.
 */

export interface SymbolRef {
  symbol: string
  name: string
  exchange: string | null
}

export interface CompanyProfile {
  symbol: string
  name: string
  exchange: string | null
  currency: string | null
  country: string | null
  sector: string | null
  industry: string | null
  website: string | null
  description: string | null
  ceo: string | null
  employees: number | null
  ipoDate: string | null
  /** Levered beta vs the market (vendor-computed, ~5y monthly). Feeds the WACC. */
  beta: number | null
  /** SEC Central Index Key — lets the SEC history source find the filer. */
  cik: string | null
}

/** One reporting period, all three statements merged. Nulls are expected — no
 *  vendor supplies every line item for every company or every year. */
export interface FinancialPeriod {
  symbol: string
  period: string // 'FY' | 'Q1'..'Q4'
  fiscalYear: number
  periodEnd: string // ISO date
  reportedCurrency: string | null

  revenue: number | null
  costOfRevenue: number | null
  grossProfit: number | null
  operatingExpenses: number | null
  operatingIncome: number | null
  ebitda: number | null
  interestExpense: number | null
  incomeTax: number | null
  netIncome: number | null
  eps: number | null
  epsDiluted: number | null
  sharesBasic: number | null
  sharesDiluted: number | null

  cashAndEquivalents: number | null
  shortTermInvestments: number | null
  inventory: number | null
  totalCurrentAssets: number | null
  totalAssets: number | null
  totalCurrentLiabilities: number | null
  shortTermDebt: number | null
  longTermDebt: number | null
  totalDebt: number | null
  totalLiabilities: number | null
  totalEquity: number | null

  operatingCashFlow: number | null
  capitalExpenditure: number | null
  freeCashFlow: number | null
  dividendsPaid: number | null
  shareBuybacks: number | null
}

export interface Quote {
  symbol: string
  price: number | null
  previousClose: number | null
  dayChangePct: number | null
  marketCap: number | null
  sharesOutstanding: number | null
  volume: number | null
  peRatio: number | null
  yearHigh: number | null
  yearLow: number | null
}

export interface PriceBar {
  symbol: string
  tradeDate: string // ISO date
  open: number | null
  high: number | null
  low: number | null
  close: number
  adjClose: number | null
  volume: number | null
}

export interface MarketDataProvider {
  readonly name: string

  /** Investable universe for the given exchanges. */
  listSymbols(exchanges: string[]): Promise<SymbolRef[]>

  getProfile(symbol: string): Promise<CompanyProfile | null>

  /** Annual statements, newest first. `limit` = number of years. */
  getAnnualFinancials(symbol: string, limit: number): Promise<FinancialPeriod[]>

  /** Quarterly statements, newest first. `limit` = number of quarters. */
  getQuarterlyFinancials(symbol: string, limit: number): Promise<FinancialPeriod[]>

  /** Batched — vendors charge per call, not per symbol. */
  getQuotes(symbols: string[]): Promise<Quote[]>

  /** Daily bars from `from` (ISO date) to today. */
  getDailyPrices(symbol: string, from: string): Promise<PriceBar[]>

  /** Next scheduled earnings date on or after `today` (ISO), or null if none announced. */
  getNextEarningsDate(symbol: string, today: string): Promise<string | null>
}

/** Thrown for vendor responses that should NOT be retried (bad key, bad symbol). */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}
