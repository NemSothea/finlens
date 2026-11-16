import { db, toDate } from '@/db'
import {
  refs,
  type CompanyDoc,
  type PortfolioDoc,
  type TransactionDoc,
  type WatchlistItemDoc,
} from '@/db/schema'
import { summarisePortfolio, type PortfolioSummary, type Transaction } from '@/lib/portfolio/positions'

/**
 * Per-user reads. Every function takes `userId` as its first argument, and
 * all per-user data lives under `users/{userId}/…` — ownership is part of the
 * document path itself. There is no way to address another account's
 * watchlist or portfolio from here, because the path would not exist under
 * this user.
 */

export interface WatchlistRow {
  id: string
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
  const items = await refs.watchlist(userId).orderBy('addedAt', 'desc').get()
  if (items.empty) return []

  // One batched read for every company — Firestore's stand-in for the join.
  const companies = await db.getAll(...items.docs.map((d) => refs.company(d.id)))
  const bySymbol = new Map(
    companies.filter((c) => c.exists).map((c) => [c.id, c.data() as CompanyDoc]),
  )

  const rows: WatchlistRow[] = []
  for (const doc of items.docs) {
    const item = doc.data() as WatchlistItemDoc
    const company = bySymbol.get(doc.id)
    // Inner-join semantics: a symbol dropped from the universe entirely
    // disappears from the list rather than rendering a nameless row.
    if (!company) continue

    rows.push({
      id: doc.id,
      symbol: doc.id,
      name: company.name,
      sector: company.sector ?? null,
      note: item.note ?? null,
      targetPrice: item.targetPrice ?? null,
      addedAt: toDate(item.addedAt) ?? new Date(0),
      price: company.quote?.price ?? null,
      dayChangePct: company.quote?.dayChangePct ?? null,
      marketCap: company.quote?.marketCap ?? null,
      fairValuePerShare: company.dcf?.fairValuePerShare ?? null,
      marginOfSafetyPct: company.dcf?.marginOfSafetyPct ?? null,
    })
  }
  return rows
}

/** Watched symbols, newest first — ids only, no company reads. */
export async function listWatchedSymbols(userId: string): Promise<string[]> {
  const snap = await refs.watchlist(userId).orderBy('addedAt', 'desc').select().get()
  return snap.docs.map((d) => d.id)
}

export async function isWatched(userId: string, symbol: string): Promise<boolean> {
  return (await refs.watchlistItem(userId, symbol).get()).exists
}

export async function countWatchlist(userId: string): Promise<number> {
  const agg = await refs.watchlist(userId).count().get()
  return agg.data().count
}

export interface PortfolioRow {
  id: string
  name: string
  baseCurrency: string
  createdAt: Date
}

function toPortfolioRow(id: string, p: PortfolioDoc): PortfolioRow {
  return {
    id,
    name: p.name,
    baseCurrency: p.baseCurrency,
    createdAt: toDate(p.createdAt) ?? new Date(0),
  }
}

export async function listPortfolios(userId: string): Promise<PortfolioRow[]> {
  const snap = await refs.portfolios(userId).orderBy('createdAt', 'asc').get()
  return snap.docs.map((d) => toPortfolioRow(d.id, d.data() as PortfolioDoc))
}

/** Ownership check used by every mutation before it touches a portfolio. */
export async function ownsPortfolio(userId: string, portfolioId: string): Promise<boolean> {
  if (!isValidDocId(portfolioId)) return false
  return (await refs.portfolio(userId, portfolioId).get()).exists
}

export interface TransactionRow extends Transaction {
  note: string | null
  currency: string
}

export async function getTransactions(
  userId: string,
  portfolioId: string,
): Promise<TransactionRow[]> {
  if (!isValidDocId(portfolioId)) return []

  const snap = await refs
    .transactions(userId, portfolioId)
    .orderBy('tradedAt', 'desc')
    .orderBy('createdAt', 'desc')
    .get()

  return snap.docs.map((d) => {
    const t = d.data() as TransactionDoc
    const createdAt = toDate(t.createdAt) ?? new Date(0)
    return {
      id: d.id,
      symbol: t.symbol,
      kind: t.kind as Transaction['kind'],
      quantity: Number(t.quantity),
      pricePerShare: Number(t.pricePerShare),
      fees: Number(t.fees),
      tradedAt: toDate(t.tradedAt) ?? new Date(0),
      createdAt,
      note: t.note ?? null,
      currency: t.currency,
    }
  })
}

export interface PortfolioDetail {
  portfolio: PortfolioRow
  transactions: TransactionRow[]
  summary: PortfolioSummary
}

export async function getPortfolioDetail(
  userId: string,
  portfolioId: string,
): Promise<PortfolioDetail | null> {
  if (!isValidDocId(portfolioId)) return null

  const snap = await refs.portfolio(userId, portfolioId).get()
  if (!snap.exists) return null

  const portfolio = toPortfolioRow(snap.id, snap.data() as PortfolioDoc)
  const txs = await getTransactions(userId, portfolioId)

  const symbols = [...new Set(txs.map((t) => t.symbol.toUpperCase()))]
  const companySnaps = symbols.length
    ? await db.getAll(...symbols.map((s) => refs.company(s)), { fieldMask: ['quote.price'] })
    : []

  const prices = new Map<string, number | null>(
    companySnaps
      .filter((c) => c.exists)
      .map((c) => [c.id, (c.data() as Pick<CompanyDoc, 'quote'>).quote?.price ?? null]),
  )

  return { portfolio, transactions: txs, summary: summarisePortfolio(txs, prices) }
}

/** Every user gets a portfolio on first use — an empty state with no container
 *  to put anything in is a dead end. */
export async function getOrCreateDefaultPortfolio(userId: string): Promise<PortfolioRow> {
  const existing = await listPortfolios(userId)
  if (existing.length > 0) return existing[0]

  // Fixed id, created in a transaction: two tabs opening /portfolio at once
  // must converge on one default portfolio, not create two.
  const ref = refs.portfolio(userId, 'default')
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists) return toPortfolioRow(ref.id, snap.data() as PortfolioDoc)

    const doc: PortfolioDoc = { name: 'My portfolio', baseCurrency: 'USD', createdAt: new Date() }
    tx.create(ref, doc)
    return toPortfolioRow(ref.id, doc)
  })
}

/** Client-supplied ids become path segments; reject anything that could
 *  escape the intended collection or is not an id we would have issued. */
export function isValidDocId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id)
}
