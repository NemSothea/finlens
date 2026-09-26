import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  doublePrecision,
  numeric,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  serial,
} from 'drizzle-orm/pg-core'

/* ------------------------------------------------------------------ *
 * Reference data — owned copy of vendor fundamentals.
 * Every column the app reads lives here. The vendor is never on the
 * request path; the ingest pipeline is the only writer.
 * ------------------------------------------------------------------ */

export const companies = pgTable(
  'companies',
  {
    symbol: text('symbol').primaryKey(),
    name: text('name').notNull(),
    exchange: text('exchange'),
    currency: text('currency'),
    country: text('country'),
    sector: text('sector'),
    industry: text('industry'),
    website: text('website'),
    description: text('description'),
    ceo: text('ceo'),
    employees: integer('employees'),
    ipoDate: date('ipo_date'),
    /** false = delisted or dropped from our universe; we keep the history. */
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('companies_exchange_idx').on(t.exchange), index('companies_sector_idx').on(t.sector)],
)

/**
 * All three statements flattened into one row per reporting period.
 *
 * Flattened rather than three tables because every read path we have wants
 * revenue, net income and free cash flow together — splitting them buys
 * normalisation we never use and costs a 3-way join on the hottest query.
 */
export const financialStatements = pgTable(
  'financial_statements',
  {
    id: serial('id').primaryKey(),
    symbol: text('symbol')
      .notNull()
      .references(() => companies.symbol, { onDelete: 'cascade' }),
    /** 'FY' annual, 'Q1'..'Q4' quarterly, 'TTM' derived. */
    period: text('period').notNull(),
    fiscalYear: integer('fiscal_year').notNull(),
    periodEnd: date('period_end').notNull(),
    reportedCurrency: text('reported_currency'),

    // income statement
    revenue: doublePrecision('revenue'),
    costOfRevenue: doublePrecision('cost_of_revenue'),
    grossProfit: doublePrecision('gross_profit'),
    operatingExpenses: doublePrecision('operating_expenses'),
    operatingIncome: doublePrecision('operating_income'),
    ebitda: doublePrecision('ebitda'),
    interestExpense: doublePrecision('interest_expense'),
    incomeTax: doublePrecision('income_tax'),
    netIncome: doublePrecision('net_income'),
    eps: doublePrecision('eps'),
    epsDiluted: doublePrecision('eps_diluted'),
    sharesBasic: doublePrecision('shares_basic'),
    sharesDiluted: doublePrecision('shares_diluted'),

    // balance sheet
    cashAndEquivalents: doublePrecision('cash_and_equivalents'),
    shortTermInvestments: doublePrecision('short_term_investments'),
    inventory: doublePrecision('inventory'),
    totalCurrentAssets: doublePrecision('total_current_assets'),
    totalAssets: doublePrecision('total_assets'),
    totalCurrentLiabilities: doublePrecision('total_current_liabilities'),
    shortTermDebt: doublePrecision('short_term_debt'),
    longTermDebt: doublePrecision('long_term_debt'),
    totalDebt: doublePrecision('total_debt'),
    totalLiabilities: doublePrecision('total_liabilities'),
    totalEquity: doublePrecision('total_equity'),

    // cash flow
    operatingCashFlow: doublePrecision('operating_cash_flow'),
    capitalExpenditure: doublePrecision('capital_expenditure'),
    freeCashFlow: doublePrecision('free_cash_flow'),
    dividendsPaid: doublePrecision('dividends_paid'),
    shareBuybacks: doublePrecision('share_buybacks'),

    source: text('source').notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // natural key — the upsert target for idempotent re-ingest
    uniqueIndex('financials_symbol_period_end_uq').on(t.symbol, t.period, t.periodEnd),
    index('financials_symbol_year_idx').on(t.symbol, t.fiscalYear),
  ],
)

export const quotes = pgTable('quotes', {
  symbol: text('symbol')
    .primaryKey()
    .references(() => companies.symbol, { onDelete: 'cascade' }),
  price: doublePrecision('price'),
  previousClose: doublePrecision('previous_close'),
  dayChangePct: doublePrecision('day_change_pct'),
  marketCap: doublePrecision('market_cap'),
  sharesOutstanding: doublePrecision('shares_outstanding'),
  volume: doublePrecision('volume'),
  peRatio: doublePrecision('pe_ratio'),
  yearHigh: doublePrecision('year_high'),
  yearLow: doublePrecision('year_low'),
  asOf: timestamp('as_of', { withTimezone: true }).notNull().defaultNow(),
})

export const priceHistory = pgTable(
  'price_history',
  {
    symbol: text('symbol')
      .notNull()
      .references(() => companies.symbol, { onDelete: 'cascade' }),
    tradeDate: date('trade_date').notNull(),
    open: doublePrecision('open'),
    high: doublePrecision('high'),
    low: doublePrecision('low'),
    close: doublePrecision('close').notNull(),
    adjClose: doublePrecision('adj_close'),
    volume: doublePrecision('volume'),
  },
  (t) => [primaryKey({ columns: [t.symbol, t.tradeDate] })],
)

/**
 * Cached valuation output. `assumptions` is stored alongside the result so any
 * number shown in the UI can be explained months later — without it, a stale
 * fair value is indistinguishable from a wrong one.
 */
export const valuations = pgTable(
  'valuations',
  {
    id: serial('id').primaryKey(),
    symbol: text('symbol')
      .notNull()
      .references(() => companies.symbol, { onDelete: 'cascade' }),
    method: text('method').notNull(), // 'dcf' | 'reverse_dcf'
    fairValuePerShare: doublePrecision('fair_value_per_share'),
    marginOfSafetyPct: doublePrecision('margin_of_safety_pct'),
    impliedGrowthRate: doublePrecision('implied_growth_rate'),
    assumptions: jsonb('assumptions').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('valuations_symbol_method_uq').on(t.symbol, t.method)],
)

/* ------------------------------------------------------------------ *
 * Auth.js v5 adapter tables
 * ------------------------------------------------------------------ */

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
)

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
)

/* ------------------------------------------------------------------ *
 * Subscription + user data
 * ------------------------------------------------------------------ */

export const subscriptions = pgTable('subscriptions', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(), // 'free' | 'pro_monthly' | 'pro_annual'
  status: text('status').notNull(), // 'active' | 'past_due' | 'canceled' | 'trialing'
  provider: text('provider'), // 'payway' | 'khqr' | 'stripe' | 'manual'
  providerRef: text('provider_ref'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const watchlistItems = pgTable(
  'watchlist_items',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    symbol: text('symbol')
      .notNull()
      .references(() => companies.symbol, { onDelete: 'cascade' }),
    note: text('note'),
    targetPrice: numeric('target_price', { precision: 18, scale: 6 }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('watchlist_user_symbol_uq').on(t.userId, t.symbol)],
)

export const portfolios = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  baseCurrency: text('base_currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Immutable trade log. Positions are DERIVED from this on read and are never
 * stored — that keeps cost basis auditable and makes corrections additive
 * instead of destructive.
 */
export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    portfolioId: integer('portfolio_id')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    symbol: text('symbol').notNull(),
    kind: text('kind').notNull(), // 'buy' | 'sell' | 'dividend' | 'split'
    quantity: numeric('quantity', { precision: 24, scale: 8 }).notNull(),
    pricePerShare: numeric('price_per_share', { precision: 18, scale: 6 }).notNull(),
    fees: numeric('fees', { precision: 18, scale: 6 }).notNull().default('0'),
    currency: text('currency').notNull().default('USD'),
    tradedAt: timestamp('traded_at', { withTimezone: true }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('transactions_portfolio_idx').on(t.portfolioId, t.symbol)],
)

/* ------------------------------------------------------------------ *
 * Payments
 * ------------------------------------------------------------------ */

/**
 * A single purchase attempt. One row per checkout, created BEFORE the user is
 * sent to the provider — so a payment that completes while the browser dies
 * still has somewhere to land when the webhook arrives.
 */
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // 'payway' | 'manual'
    /** Our id, sent to the provider and echoed back. Unique per attempt. */
    reference: text('reference').notNull(),
    /** The provider's own transaction id, once known. */
    providerRef: text('provider_ref'),
    plan: text('plan').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull().default('pending'), // pending|paid|failed|refunded
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payments_provider_reference_uq').on(t.provider, t.reference),
    index('payments_user_idx').on(t.userId),
  ],
)

/**
 * Webhook ledger — the idempotency mechanism.
 *
 * Every inbound provider callback is recorded here first, keyed by the
 * provider's own event id. The unique index is what makes replay safe: a
 * duplicate insert conflicts, the handler sees it was already processed, and
 * the subscription is not extended twice.
 *
 * Providers retry aggressively and deliver out of order. Assuming exactly-once
 * delivery is how customers end up with double billing periods.
 */
export const paymentEvents = pgTable(
  'payment_events',
  {
    id: serial('id').primaryKey(),
    provider: text('provider').notNull(),
    /** The provider's unique id for this event. The idempotency key. */
    eventId: text('event_id').notNull(),
    type: text('type').notNull(),
    reference: text('reference'),
    payload: jsonb('payload').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    /** 'applied' | 'duplicate' | 'ignored' | 'error' */
    result: text('result'),
    error: text('error'),
  },
  (t) => [uniqueIndex('payment_events_provider_event_uq').on(t.provider, t.eventId)],
)

/* ------------------------------------------------------------------ *
 * Pipeline observability — a nightly run that fails silently is the
 * failure mode that kills data products.
 * ------------------------------------------------------------------ */

export const ingestRuns = pgTable('ingest_runs', {
  id: serial('id').primaryKey(),
  stage: text('stage').notNull(),
  status: text('status').notNull(), // 'running' | 'ok' | 'partial' | 'failed'
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  itemsOk: integer('items_ok').notNull().default(0),
  itemsFailed: integer('items_failed').notNull().default(0),
  vendorCalls: integer('vendor_calls').notNull().default(0),
  errors: jsonb('errors'),
})

/**
 * Alert de-duplication state.
 *
 * The health check runs hourly on a serverless function, so there is no
 * in-process memory between checks — "have we already told someone about this?"
 * has to be a row. Without it, one broken nightly run sends 24 identical
 * messages and the channel gets muted, which is the same as having no alerting.
 */
export const opsAlerts = pgTable('ops_alerts', {
  id: serial('id').primaryKey(),
  /** Identifies the problem set, not the moment — see `healthFingerprint`. */
  fingerprint: text('fingerprint').notNull().unique(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }).notNull().defaultNow(),
  sends: integer('sends').notNull().default(1),
  /** Set when the pipeline recovered, so recovery is announced exactly once. */
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
})
