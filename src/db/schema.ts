import type { Timestamp } from 'firebase-admin/firestore'
import { db, safeId } from './index'

/* ------------------------------------------------------------------ *
 * Firestore layout
 *
 *   companies/{symbol}                      profile + embedded quote + dcf summary
 *     financials/{period}_{periodEnd}       one doc per reporting period
 *     prices/{year}                         { bars: { 'YYYY-MM-DD': bar } }
 *   valuations/{symbol}_{method}            full DCF output + assumptions
 *
 *   users/{uid}                             profile mirror of the Auth record
 *     watchlist/{symbol}
 *     portfolios/{portfolioId}
 *       transactions/{transactionId}
 *   subscriptions/{uid}
 *
 *   payments/{hash(provider, reference)}
 *   paymentEvents/{hash(provider, eventId)} webhook idempotency ledger
 *   ingestRuns/{auto}
 *   opsAlerts/{hash(fingerprint)}
 *
 * Why the quote and DCF summary live inside the company doc: Firestore has no
 * joins. The detail page, the landing list, search and the watchlist all want
 * "company + price + fair value" together; embedding makes each of those one
 * read per company instead of three, and lets the landing list sort by market
 * cap in a single query.
 *
 * Why prices are bucketed by year: one doc per trading day would make a 5-year
 * chart cost ~1,250 document reads per page view. One doc per year costs 5 and
 * stays far under the 1 MiB document limit (~252 bars × ~100 bytes).
 * ------------------------------------------------------------------ */

export const COLLECTIONS = {
  companies: 'companies',
  financials: 'financials',
  prices: 'prices',
  valuations: 'valuations',
  users: 'users',
  watchlist: 'watchlist',
  portfolios: 'portfolios',
  transactions: 'transactions',
  subscriptions: 'subscriptions',
  payments: 'payments',
  paymentEvents: 'paymentEvents',
  ingestRuns: 'ingestRuns',
  opsAlerts: 'opsAlerts',
} as const

/* ------------------------------------------------------------------ *
 * Reference data — owned copy of vendor fundamentals. The ingest
 * pipeline is the only writer.
 * ------------------------------------------------------------------ */

export interface QuoteDoc {
  price: number | null
  previousClose: number | null
  dayChangePct: number | null
  marketCap: number | null
  sharesOutstanding: number | null
  volume: number | null
  peRatio: number | null
  yearHigh: number | null
  yearLow: number | null
  asOf: Timestamp | Date
}

export interface DcfSummaryDoc {
  fairValuePerShare: number | null
  marginOfSafetyPct: number | null
  impliedGrowthRate: number | null
  computedAt: Timestamp | Date
}

export interface CompanyDoc {
  symbol: string
  name: string
  exchange: string | null
  currency?: string | null
  country?: string | null
  sector?: string | null
  industry?: string | null
  website?: string | null
  description?: string | null
  ceo?: string | null
  employees?: number | null
  ipoDate?: string | null
  /** Next scheduled earnings report (ISO date), refreshed with the profile. */
  nextEarningsDate?: string | null
  /** false = delisted or dropped from our universe; we keep the history. */
  isActive: boolean
  /** Lower-cased prefixes of the ticker and of each word of the name — the
   *  search index. Firestore has no ILIKE; `array-contains` on this is the
   *  substitute. */
  keywords: string[]
  /** Denormalised from `quote.marketCap` (0 when unknown) so the landing list
   *  and search can order by size without a join. */
  marketCap: number
  /** Newest stored price bar — where the incremental price stage resumes. */
  lastPriceDate?: string | null
  quote?: QuoteDoc | null
  dcf?: DcfSummaryDoc | null
  updatedAt: Timestamp | Date
}

/**
 * All three statements flattened into one doc per reporting period, same as
 * the old table: every read path wants revenue, net income and free cash flow
 * together.
 */
export interface FinancialStatementDoc {
  symbol: string
  /** 'FY' annual, 'Q1'..'Q4' quarterly, 'TTM' derived. */
  period: string
  /** Separate flag because Firestore cannot combine `period != 'FY'` with an
   *  order on `periodEnd` without ordering on `period` first. */
  isAnnual: boolean
  fiscalYear: number
  periodEnd: string
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

  source: string
  ingestedAt: Timestamp | Date
}

/** Compact bar keys — ~250 of these share one document per year. */
export interface PriceBarDoc {
  o: number | null
  h: number | null
  l: number | null
  c: number
  ac: number | null
  v: number | null
}

export interface PriceYearDoc {
  symbol: string
  year: number
  bars: Record<string, PriceBarDoc>
}

/**
 * Cached valuation output. `assumptions` is stored alongside the result so any
 * number shown in the UI can be explained months later.
 */
export interface ValuationDoc {
  symbol: string
  method: string // 'dcf' | 'reverse_dcf'
  fairValuePerShare: number | null
  marginOfSafetyPct: number | null
  impliedGrowthRate: number | null
  assumptions: unknown
  computedAt: Timestamp | Date
}

/* ------------------------------------------------------------------ *
 * Users — identity lives in Firebase Auth; this is the mirror the app
 * reads (checkout email, admin scripts). `role` is authoritative as a
 * custom claim on the Auth record; the copy here is for display.
 * ------------------------------------------------------------------ */

export interface UserDoc {
  email: string | null
  name: string | null
  image: string | null
  role: string // 'user' | 'admin'
  createdAt: Timestamp | Date
}

export interface SubscriptionDoc {
  plan: string // 'free' | 'pro_monthly' | 'pro_annual'
  status: string // 'active' | 'past_due' | 'canceled' | 'trialing'
  provider: string | null // 'payway' | 'khqr' | 'stripe' | 'manual'
  providerRef: string | null
  currentPeriodEnd: Timestamp | Date | null
  cancelAtPeriodEnd: boolean
  updatedAt: Timestamp | Date
}

export interface WatchlistItemDoc {
  symbol: string
  note: string | null
  targetPrice: number | null
  addedAt: Timestamp | Date
}

export interface PortfolioDoc {
  name: string
  baseCurrency: string
  createdAt: Timestamp | Date
}

/**
 * Immutable trade log. Positions are DERIVED from this on read and are never
 * stored — cost basis stays auditable and corrections are additive.
 */
export interface TransactionDoc {
  symbol: string
  kind: string // 'buy' | 'sell' | 'dividend' | 'split'
  quantity: number
  pricePerShare: number
  fees: number
  currency: string
  tradedAt: Timestamp | Date
  note: string | null
  createdAt: Timestamp | Date
}

/* ------------------------------------------------------------------ *
 * Payments
 * ------------------------------------------------------------------ */

/**
 * A single purchase attempt, written BEFORE the user is sent to the provider
 * so a payment that completes while the browser dies still has somewhere to
 * land when the webhook arrives.
 */
export interface PaymentDoc {
  userId: string
  provider: string
  /** Our id, sent to the provider and echoed back. Unique per attempt. */
  reference: string
  providerRef: string | null
  plan: string
  amount: number
  currency: string
  status: string // pending|paid|failed|refunded
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

/**
 * Webhook ledger — the idempotency mechanism. The doc id is derived from the
 * provider's own event id, so a replay finds the doc already there and stops
 * before the subscription is extended twice.
 */
export interface PaymentEventDoc {
  provider: string
  eventId: string
  type: string
  reference: string | null
  /** Raw provider payload as JSON text. */
  payload: string
  receivedAt: Timestamp | Date
  processedAt: Timestamp | Date | null
  /** 'applied' | 'duplicate' | 'ignored' | 'error' */
  result: string | null
  error: string | null
}

/* ------------------------------------------------------------------ *
 * Pipeline observability
 * ------------------------------------------------------------------ */

export interface IngestRunDoc {
  stage: string
  status: string // 'running' | 'ok' | 'partial' | 'failed'
  startedAt: Timestamp | Date
  finishedAt: Timestamp | Date | null
  itemsOk: number
  itemsFailed: number
  vendorCalls: number
  errors: Array<{ item: string; message: string }> | null
}

/**
 * Alert de-duplication state. The health check runs on a serverless function
 * with no memory between runs, so "have we already told someone?" is a doc.
 */
export interface OpsAlertDoc {
  fingerprint: string
  firstSeenAt: Timestamp | Date
  lastSentAt: Timestamp | Date
  sends: number
  resolvedAt: Timestamp | Date | null
}

/* ------------------------------------------------------------------ *
 * References — one place that knows the paths.
 * ------------------------------------------------------------------ */

export const refs = {
  companies: () => db.collection(COLLECTIONS.companies),
  company: (symbol: string) => db.collection(COLLECTIONS.companies).doc(symbol.toUpperCase()),
  financials: (symbol: string) => refs.company(symbol).collection(COLLECTIONS.financials),
  financial: (symbol: string, period: string, periodEnd: string) =>
    refs.financials(symbol).doc(`${period}_${periodEnd}`),
  prices: (symbol: string) => refs.company(symbol).collection(COLLECTIONS.prices),
  priceYear: (symbol: string, year: number) => refs.prices(symbol).doc(String(year)),
  valuation: (symbol: string, method: string) =>
    db.collection(COLLECTIONS.valuations).doc(`${symbol.toUpperCase()}_${method}`),

  user: (uid: string) => db.collection(COLLECTIONS.users).doc(uid),
  watchlist: (uid: string) => refs.user(uid).collection(COLLECTIONS.watchlist),
  watchlistItem: (uid: string, symbol: string) => refs.watchlist(uid).doc(symbol.toUpperCase()),
  portfolios: (uid: string) => refs.user(uid).collection(COLLECTIONS.portfolios),
  portfolio: (uid: string, portfolioId: string) => refs.portfolios(uid).doc(portfolioId),
  transactions: (uid: string, portfolioId: string) =>
    refs.portfolio(uid, portfolioId).collection(COLLECTIONS.transactions),
  subscription: (uid: string) => db.collection(COLLECTIONS.subscriptions).doc(uid),

  payment: (provider: string, reference: string) =>
    db.collection(COLLECTIONS.payments).doc(safeId(provider, reference)),
  paymentEvent: (provider: string, eventId: string) =>
    db.collection(COLLECTIONS.paymentEvents).doc(safeId(provider, eventId)),
  ingestRuns: () => db.collection(COLLECTIONS.ingestRuns),
  opsAlerts: () => db.collection(COLLECTIONS.opsAlerts),
  opsAlert: (fingerprint: string) => db.collection(COLLECTIONS.opsAlerts).doc(safeId(fingerprint)),
}

/**
 * Search index terms. Every prefix (min length 1 for the ticker, 2 for name
 * words) up to 20 chars, lower-cased. "Apple Inc." → a, aa, aap, aapl, ap, app,
 * appl, apple, in, inc.
 */
export function buildKeywords(symbol: string, name: string): string[] {
  const out = new Set<string>()
  const add = (word: string, minLength: number) => {
    const w = word.toLowerCase().slice(0, 20)
    for (let i = minLength; i <= w.length; i++) out.add(w.slice(0, i))
  }

  add(symbol.replace(/[^A-Za-z0-9.\-]/g, ''), 1)
  for (const word of name.split(/[^\p{L}\p{N}]+/u)) {
    if (word) add(word, 2)
  }
  return [...out]
}
