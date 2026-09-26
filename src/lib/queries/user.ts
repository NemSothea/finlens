import { db } from '@/db'
import {
  companies,
  portfolios,
  quotes,
  transactions,
  valuations,
  watchlistItems,
} from '@/db/schema'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { summarisePortfolio, type PortfolioSummary, type Transaction } from '@/lib/portfolio/positions'

/**
 * Per-user reads. Every function takes `userId` as its first argument and
 * filters on it — ownership is enforced in the query, not by the caller
 * remembering to check. A missing WHERE here is a data leak between accounts,
 * so there is no "get by id" that does not also scope to the owner.
 */

export interface WatchlistRow {
  id: number
  symbol: string
  name: string
  sector: string | null
  note: string | null
  targetPrice: number | null
  addedAt: Date
  price: number | null
  dayChangePct: number | null
  marketCap: number | null
  fairValuePerShare: number | null
  marginOfSafetyPct: number | null
}

export async function getWatchlist(userId: string): Promise<WatchlistRow[]> {
  const rows = await db
    .select({
      id: watchlistItems.id,
      symbol: watchlistItems.symbol,
      note: watchlistItems.note,
      targetPrice: watchlistItems.targetPrice,
      addedAt: watchlistItems.addedAt,
      name: companies.name,
      sector: companies.sector,
      price: quotes.price,
      dayChangePct: quotes.dayChangePct,
      marketCap: quotes.marketCap,
      fairValuePerShare: valuations.fairValuePerShare,
      marginOfSafetyPct: valuations.marginOfSafetyPct,
    })
    .from(watchlistItems)
    .innerJoin(companies, eq(companies.symbol, watchlistItems.symbol))
    .leftJoin(quotes, eq(quotes.symbol, watchlistItems.symbol))
    .leftJoin(
      valuations,
      and(eq(valuations.symbol, watchlistItems.symbol), eq(valuations.method, 'dcf')),
    )
    .where(eq(watchlistItems.userId, userId))
    .orderBy(desc(watchlistItems.addedAt))

  return rows.map((r) => ({
    ...r,
    // numeric columns arrive as strings from postgres-js; convert once, here,
    // so nothing downstream has to remember to.
    targetPrice: r.targetPrice == null ? null : Number(r.targetPrice),
  }))
}

export async function isWatched(userId: string, symbol: string): Promise<boolean> {
  const [row] = await db
    .select({ id: watchlistItems.id })
    .from(watchlistItems)
    .where(
      and(eq(watchlistItems.userId, userId), eq(watchlistItems.symbol, symbol.toUpperCase())),
    )
    .limit(1)

  return Boolean(row)
}

export interface PortfolioRow {
  id: number
  name: string
  baseCurrency: string
  createdAt: Date
}

export async function listPortfolios(userId: string): Promise<PortfolioRow[]> {
  return db
    .select({
      id: portfolios.id,
      name: portfolios.name,
      baseCurrency: portfolios.baseCurrency,
      createdAt: portfolios.createdAt,
    })
    .from(portfolios)
    .where(eq(portfolios.userId, userId))
    .orderBy(asc(portfolios.createdAt))
}

/** Ownership check used by every mutation before it touches a portfolio. */
export async function ownsPortfolio(userId: string, portfolioId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1)

  return Boolean(row)
}

export interface TransactionRow extends Transaction {
  note: string | null
  currency: string
}

export async function getTransactions(
  userId: string,
  portfolioId: number,
): Promise<TransactionRow[]> {
  const rows = await db
    .select({
      id: transactions.id,
      symbol: transactions.symbol,
      kind: transactions.kind,
      quantity: transactions.quantity,
      pricePerShare: transactions.pricePerShare,
      fees: transactions.fees,
      currency: transactions.currency,
      tradedAt: transactions.tradedAt,
      note: transactions.note,
    })
    .from(transactions)
    // Join through portfolios so ownership is part of the query itself.
    .innerJoin(portfolios, eq(portfolios.id, transactions.portfolioId))
    .where(and(eq(transactions.portfolioId, portfolioId), eq(portfolios.userId, userId)))
    .orderBy(desc(transactions.tradedAt), desc(transactions.id))

  return rows.map((r) => ({
    id: r.id,
    symbol: r.symbol,
    kind: r.kind as Transaction['kind'],
    quantity: Number(r.quantity),
    pricePerShare: Number(r.pricePerShare),
    fees: Number(r.fees),
    tradedAt: r.tradedAt,
    note: r.note,
    currency: r.currency,
  }))
}

export interface PortfolioDetail {
  portfolio: PortfolioRow
  transactions: TransactionRow[]
  summary: PortfolioSummary
}

export async function getPortfolioDetail(
  userId: string,
  portfolioId: number,
): Promise<PortfolioDetail | null> {
  const [portfolio] = await db
    .select({
      id: portfolios.id,
      name: portfolios.name,
      baseCurrency: portfolios.baseCurrency,
      createdAt: portfolios.createdAt,
    })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1)

  if (!portfolio) return null

  const txs = await getTransactions(userId, portfolioId)

  const symbols = [...new Set(txs.map((t) => t.symbol.toUpperCase()))]

  const priceRows = symbols.length
    ? await db
        .select({ symbol: quotes.symbol, price: quotes.price })
        .from(quotes)
        .where(inArray(quotes.symbol, symbols))
    : []

  const prices = new Map(priceRows.map((p) => [p.symbol, p.price]))

  return { portfolio, transactions: txs, summary: summarisePortfolio(txs, prices) }
}

/** Every user gets a portfolio on first use — an empty state with no container
 *  to put anything in is a dead end. */
export async function getOrCreateDefaultPortfolio(userId: string): Promise<PortfolioRow> {
  const existing = await listPortfolios(userId)
  if (existing.length > 0) return existing[0]

  const [created] = await db
    .insert(portfolios)
    .values({ userId, name: 'My portfolio', baseCurrency: 'USD' })
    .returning({
      id: portfolios.id,
      name: portfolios.name,
      baseCurrency: portfolios.baseCurrency,
      createdAt: portfolios.createdAt,
    })

  return created
}
