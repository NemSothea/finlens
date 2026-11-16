import { fetchJson, RateLimiter } from './http'
import type { CompanyProfile } from './types'

/**
 * Every US-listed company, from SEC EDGAR — the free "universe" the FMP free
 * plan will not give us (its stock list returns HTTP 402).
 *
 * Two sources for the ticker list:
 *   - `company_tickers_exchange.json`, SEC's official ticker → CIK file. SEC
 *     only serves it to clients that identify themselves with a contact
 *     ("app-name contact@domain"), so it is used when SEC_USER_AGENT holds one.
 *   - EDGAR's company autocomplete, which needs no contact, as the fallback.
 *     It is the endpoint EDGAR's own search box uses, not a documented API, so
 *     it is only the fallback.
 *
 * Company profiles come from `data.sec.gov/submissions`: name, exchange,
 * industry (SIC) and fiscal year end. No description, CEO or beta — beta is
 * computed from prices instead (see `valuation/beta.ts`).
 */

export interface DirectoryEntry {
  symbol: string
  name: string
  cik: string
  /** Null from the autocomplete fallback, which does not report it. */
  exchange: string | null
}

const LISTED = new Set(['NASDAQ', 'NYSE', 'NYSE AMERICAN', 'NYSE ARCA', 'CBOE'])
const limiter = new RateLimiter(4, 4)

function userAgent(): string {
  return process.env.SEC_USER_AGENT || 'finlens/1.0'
}

/** SEC wants a contact in the User-Agent for www.sec.gov files. */
function hasContact(): boolean {
  return /@/.test(process.env.SEC_USER_AGENT ?? '')
}

function get<T>(url: string) {
  return fetchJson<T>(url, { limiter, headers: { 'user-agent': userAgent() }, timeoutMs: 15_000, retries: 1 })
}

/** "COSTCO WHOLESALE CORP /NEW" → "Costco Wholesale Corp". */
export function cleanCompanyName(raw: string): string {
  const keepUpper = new Set(['II', 'III', 'IV', 'LP', 'LLC', 'PLC', 'NV', 'SA', 'AG', 'SE', 'ETF', 'REIT', 'US', 'USA'])
  return raw
    .replace(/\s*\([^)]*\)\s*$/, '') // "(COST)" in autocomplete names
    .replace(/\s+\/[A-Z]{2,}\/?$/i, '') // EDGAR state/re-registration suffixes
    .trim()
    .split(/\s+/)
    .map((w) => {
      const bare = w.replace(/[^A-Za-z]/g, '').toUpperCase()
      if (keepUpper.has(bare)) return w.toUpperCase()
      if (w !== w.toUpperCase()) return w // already mixed case, e.g. "Costco Wholesale"
      return w.charAt(0) + w.slice(1).toLowerCase()
    })
    .join(' ')
}

export function normaliseExchange(raw: string | null | undefined): string | null {
  if (!raw) return null
  const up = raw.toUpperCase()
  if (up === 'NASDAQ') return 'NASDAQ'
  if (up.startsWith('NYSE')) return up === 'NYSE' ? 'NYSE' : up.replace('NYSE MKT', 'NYSE AMERICAN')
  return up
}

export function isListed(exchange: string | null): boolean {
  return exchange != null && LISTED.has(exchange)
}

/* ------------------------------------------------------------------ *
 * Official ticker file (needs a contact in SEC_USER_AGENT)
 * ------------------------------------------------------------------ */

let tickerFile: { at: number; rows: DirectoryEntry[] } | null = null
const DAY_MS = 86_400_000

async function officialTickers(): Promise<DirectoryEntry[] | null> {
  if (!hasContact()) return null
  if (tickerFile && Date.now() - tickerFile.at < DAY_MS) return tickerFile.rows
  try {
    const raw = await get<{ fields: string[]; data: Array<Array<string | number>> }>(
      'https://www.sec.gov/files/company_tickers_exchange.json',
    )
    const i = Object.fromEntries(raw.fields.map((f, n) => [f, n]))
    const rows = raw.data
      .map((r) => ({
        symbol: String(r[i.ticker]).toUpperCase(),
        name: cleanCompanyName(String(r[i.name])),
        cik: String(r[i.cik]),
        exchange: normaliseExchange(r[i.exchange] as string | null),
      }))
      .filter((r) => isListed(r.exchange))
    tickerFile = { at: Date.now(), rows }
    return rows
  } catch (error) {
    console.warn(`[sec] ticker file unavailable, using autocomplete — ${(error as Error).message}`)
    return null
  }
}

/** Rank: exact ticker, ticker prefix, name prefix, any word prefix. */
export function rankEntries(rows: DirectoryEntry[], query: string, limit: number): DirectoryEntry[] {
  const q = query.trim().toUpperCase()
  if (!q) return []
  const score = (r: DirectoryEntry) => {
    if (r.symbol === q) return 0
    if (r.symbol.startsWith(q)) return 1
    const name = r.name.toUpperCase()
    if (name.startsWith(q)) return 2
    if (name.split(/\s+/).some((w) => w.startsWith(q))) return 3
    return 9
  }
  return rows
    .map((r) => ({ r, s: score(r) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || a.r.symbol.length - b.r.symbol.length)
    .slice(0, limit)
    .map((x) => x.r)
}

/* ------------------------------------------------------------------ *
 * Autocomplete fallback (no contact needed)
 * ------------------------------------------------------------------ */

interface AutocompleteHit {
  _id: string
  _source: { entity: string; tickers?: string }
}

async function autocomplete(query: string): Promise<DirectoryEntry[]> {
  const raw = await get<{ hits?: { hits?: AutocompleteHit[] } }>(
    `https://efts.sec.gov/LATEST/search-index?keysTyped=${encodeURIComponent(query)}`,
  )
  const out: DirectoryEntry[] = []
  for (const h of raw.hits?.hits ?? []) {
    const tickers = (h._source.tickers ?? '').split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
    for (const symbol of tickers) {
      out.push({ symbol, name: cleanCompanyName(h._source.entity), cik: h._id, exchange: null })
    }
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export async function searchDirectory(query: string, limit = 8): Promise<DirectoryEntry[]> {
  const q = query.trim()
  if (q.length === 0) return []
  const official = await officialTickers()
  if (official) return rankEntries(official, q, limit)
  try {
    return rankEntries(await autocomplete(q), q, limit)
  } catch (error) {
    console.warn(`[sec] autocomplete failed — ${(error as Error).message}`)
    return []
  }
}

/** The directory entry for an exact ticker, or null if SEC does not know it. */
export async function lookupSymbol(symbol: string): Promise<DirectoryEntry | null> {
  const sym = symbol.trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(sym)) return null
  const official = await officialTickers()
  const rows = official ?? (await autocomplete(sym).catch(() => []))
  return rows.find((r) => r.symbol === sym) ?? null
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

interface Submissions {
  name?: string
  tickers?: string[]
  exchanges?: Array<string | null>
  sic?: string
  sicDescription?: string
  website?: string
  stateOfIncorporation?: string
  addresses?: { business?: { stateOrCountry?: string } }
}

/**
 * Coarse sector from the SIC code. SIC predates GICS and splits industries
 * differently (Alphabet and Meta are "services-computer programming"), so
 * this is a grouping for display, not a classification to screen on.
 */
export function sectorFromSic(sicCode: string | undefined): string | null {
  const sic = Number(sicCode)
  if (!Number.isFinite(sic) || sic <= 0) return null
  const between = (a: number, b: number) => sic >= a && sic <= b
  if (between(1300, 1399) || between(2900, 2999)) return 'Energy'
  if (between(2830, 2836) || between(3840, 3851) || between(8000, 8099) || sic === 5122) return 'Healthcare'
  if (between(3570, 3579) || between(3600, 3699) || between(3800, 3839) || between(7370, 7379)) return 'Technology'
  if (between(4800, 4899) || between(7800, 7899) || between(2700, 2799)) return 'Communication Services'
  if (between(4900, 4999)) return 'Utilities'
  if (between(6500, 6553) || sic === 6798) return 'Real Estate'
  if (between(6000, 6799)) return 'Financials'
  if (between(2000, 2199) || between(5400, 5499) || sic === 5331 || between(2840, 2844)) return 'Consumer Staples'
  if (between(3711, 3716) || between(5200, 5999) || between(7000, 7099) || between(2200, 2399) || between(3900, 3999))
    return 'Consumer Discretionary'
  if (between(1000, 1299) || between(1400, 1499) || between(2600, 2699) || between(2800, 2899) || between(3000, 3399))
    return 'Materials'
  return 'Industrials'
}

export async function getSecProfile(symbol: string, cik: string): Promise<CompanyProfile & { exchange: string | null }> {
  const padded = cik.replace(/\D/g, '').padStart(10, '0')
  const s = await get<Submissions>(`https://data.sec.gov/submissions/CIK${padded}.json`)
  const idx = (s.tickers ?? []).findIndex((t) => t.toUpperCase() === symbol.toUpperCase())
  const exchange = normaliseExchange(s.exchanges?.[idx >= 0 ? idx : 0] ?? null)
  const website = s.website && /^https?:\/\//.test(s.website) ? s.website : s.website ? `https://${s.website}` : null

  return {
    symbol: symbol.toUpperCase(),
    name: cleanCompanyName(s.name ?? symbol),
    exchange,
    currency: 'USD',
    country: s.addresses?.business?.stateOrCountry?.length === 2 ? 'US' : null,
    sector: sectorFromSic(s.sic),
    industry: s.sicDescription ?? null,
    website,
    description: null,
    ceo: null,
    employees: null,
    ipoDate: null,
    beta: null,
    cik: String(Number(padded)),
  }
}
