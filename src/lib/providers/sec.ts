import { fetchJson, RateLimiter } from './http'
import type { FinancialPeriod } from './types'

/**
 * SEC EDGAR XBRL history — free, official, no key.
 *
 * Not a MarketDataProvider: it has no quotes, prices or profiles. It exists to
 * extend statement history beyond what the primary vendor's plan returns (the
 * FMP free plan stops at 5 periods). The financials stage writes the primary
 * vendor's rows first and fills OLDER periods from here, so the newest numbers
 * — and their exact definitions — stay the vendor's.
 *
 * One request per company (`companyfacts`) carries every tagged value the
 * company ever filed. Turning that into statements takes three judgements,
 * all made in `parseCompanyFacts`:
 *
 *   1. Which filing wins when a value appears in several? The ORIGINAL 10-K /
 *      10-Q (earliest filed). Later filings repeat it as a comparative, and
 *      proxy statements (DEF 14A) carry other definitions — e.g. Tesla's net
 *      income including minority interest.
 *   2. Which tag? Companies rename lines over the years (Revenues →
 *      RevenueFromContractWithCustomer… in 2018). Each field lists candidate
 *      tags; the first one with a value for that exact period wins.
 *   3. Quarters. Income statements in 10-Qs report the quarter, but cash-flow
 *      statements report year-to-date, and Q4 is never filed on its own. A
 *      quarter is therefore the 3-month value when filed, else YTD minus the
 *      previous YTD, and Q4 = full year − nine-month YTD. Per-share figures
 *      and share counts are not additive, so they are only taken when filed.
 *
 * US filers reporting in USD only.
 */

const BASE = 'https://data.sec.gov/api/xbrl/companyfacts'

/* ------------------------------------------------------------------ *
 * Raw shape
 * ------------------------------------------------------------------ */

export interface XbrlFact {
  start?: string
  end: string
  val: number
  form: string
  filed: string
  fy?: number | null
  fp?: string | null
}

export interface CompanyFacts {
  facts?: { 'us-gaap'?: Record<string, { units?: Record<string, XbrlFact[]> }> }
}

/* ------------------------------------------------------------------ *
 * Field → tag map
 * ------------------------------------------------------------------ */

type Kind = 'flow' | 'instant' | 'perShare' | 'shares'

interface FieldSpec {
  tags: string[]
  kind: Kind
  /** Cash outflows FMP stores as negatives; SEC reports payments as positives. */
  negate?: boolean
}

const F = {
  revenue: {
    kind: 'flow',
    tags: [
      'RevenueFromContractWithCustomerExcludingAssessedTax',
      'Revenues',
      'SalesRevenueNet',
      'RevenueFromContractWithCustomerIncludingAssessedTax',
    ],
  },
  costOfRevenue: { kind: 'flow', tags: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold'] },
  grossProfit: { kind: 'flow', tags: ['GrossProfit'] },
  operatingExpenses: { kind: 'flow', tags: ['OperatingExpenses', 'CostsAndExpenses'] },
  operatingIncome: { kind: 'flow', tags: ['OperatingIncomeLoss'] },
  pretaxIncome: {
    kind: 'flow',
    tags: [
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
    ],
  },
  depreciation: {
    kind: 'flow',
    tags: [
      'DepreciationDepletionAndAmortization',
      'DepreciationAmortizationAndAccretionNet',
      'DepreciationAndAmortization',
      'Depreciation',
    ],
  },
  interestExpense: { kind: 'flow', tags: ['InterestExpense', 'InterestExpenseNonoperating', 'InterestExpenseDebt'] },
  incomeTax: { kind: 'flow', tags: ['IncomeTaxExpenseBenefit'] },
  netIncome: { kind: 'flow', tags: ['NetIncomeLoss'] },
  eps: { kind: 'perShare', tags: ['EarningsPerShareBasic'] },
  epsDiluted: { kind: 'perShare', tags: ['EarningsPerShareDiluted'] },
  sharesBasic: { kind: 'shares', tags: ['WeightedAverageNumberOfSharesOutstandingBasic'] },
  sharesDiluted: { kind: 'shares', tags: ['WeightedAverageNumberOfDilutedSharesOutstanding'] },

  cashAndEquivalents: {
    kind: 'instant',
    tags: [
      'CashAndCashEquivalentsAtCarryingValue',
      'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents',
    ],
  },
  shortTermInvestments: {
    kind: 'instant',
    tags: ['ShortTermInvestments', 'MarketableSecuritiesCurrent', 'AvailableForSaleSecuritiesDebtSecuritiesCurrent'],
  },
  inventory: { kind: 'instant', tags: ['InventoryNet'] },
  totalCurrentAssets: { kind: 'instant', tags: ['AssetsCurrent'] },
  totalAssets: { kind: 'instant', tags: ['Assets'] },
  totalCurrentLiabilities: { kind: 'instant', tags: ['LiabilitiesCurrent'] },
  totalLiabilities: { kind: 'instant', tags: ['Liabilities'] },
  totalEquity: {
    kind: 'instant',
    tags: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
  },
  debtCurrent: { kind: 'instant', tags: ['DebtCurrent', 'LongTermDebtCurrent'] },
  commercialPaper: { kind: 'instant', tags: ['CommercialPaper'] },
  shortTermBorrowings: { kind: 'instant', tags: ['ShortTermBorrowings'] },
  longTermDebt: { kind: 'instant', tags: ['LongTermDebtNoncurrent'] },
  longTermDebtTotal: { kind: 'instant', tags: ['LongTermDebt'] },
  leaseTotal: { kind: 'instant', tags: ['OperatingLeaseLiability'] },
  leaseCurrent: { kind: 'instant', tags: ['OperatingLeaseLiabilityCurrent'] },
  leaseNoncurrent: { kind: 'instant', tags: ['OperatingLeaseLiabilityNoncurrent'] },
  financeLease: { kind: 'instant', tags: ['FinanceLeaseLiability'] },

  operatingCashFlow: { kind: 'flow', tags: ['NetCashProvidedByUsedInOperatingActivities'] },
  capitalExpenditure: {
    kind: 'flow',
    // NVIDIA and Amazon switched to "productive assets" (PP&E + intangibles) in 2016–2019.
    tags: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'],
    negate: true,
  },
  dividendsPaid: { kind: 'flow', tags: ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock'], negate: true },
  shareBuybacks: { kind: 'flow', tags: ['PaymentsForRepurchaseOfCommonStock'], negate: true },
} satisfies Record<string, FieldSpec>

type FieldKey = keyof typeof F

/** Tags whose annual values define the fiscal years we can build. */
const ANCHOR_TAGS = [...F.netIncome.tags, ...F.revenue.tags, ...F.operatingCashFlow.tags]

const FILING_FORMS = new Set(['10-K', '10-K/A', '10-Q', '10-Q/A'])
const UNIT: Record<Kind, string> = { flow: 'USD', instant: 'USD', perShare: 'USD/shares', shares: 'shares' }

/* ------------------------------------------------------------------ *
 * Dates
 * ------------------------------------------------------------------ */

const DAY = 86_400_000
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY)
const isYear = (start: string, end: string) => {
  const d = days(start, end)
  return d >= 350 && d <= 380
}
const isQuarter = (start: string, end: string) => {
  const d = days(start, end)
  // 12-week (84 d) to 16-week (112 d) quarters — retailers like Costco use both.
  return d >= 80 && d <= 115
}

/**
 * Fiscal-year label, matching FMP: the calendar year the fiscal year ends in
 * (NVIDIA's year ending 2026-01-25 is FY2026), except 52/53-week years that
 * spill a few days into January, which belong to the previous year.
 */
export function fiscalYearLabel(end: string): number {
  const d = new Date(`${end}T00:00:00Z`)
  return d.getUTCMonth() === 0 && d.getUTCDate() <= 7 ? d.getUTCFullYear() - 1 : d.getUTCFullYear()
}

/* ------------------------------------------------------------------ *
 * Fact index: tag → "start|end" (or "|end" for instants) → value
 * ------------------------------------------------------------------ */

type Index = Map<string, Map<string, number>> & {
  /** "start|end" keys of full-year values filed on a 10-K — the real fiscal years. */
  annualKeys: Set<string>
  /** Filing date of the original value, per tag and key (for split adjustment). */
  filed: Map<string, Map<string, string>>
  splits: SplitEvent[]
}

interface SplitEvent {
  /** New shares per old share: 4 for a 4-for-1 split, 0.1 for a 1-for-10 reverse. */
  ratio: number
  /** First filing that reports post-split figures. */
  from: string
}

const SHARE_TAGS = [...(['sharesBasic', 'sharesDiluted'] as const).flatMap((k) => F[k].tags)]

/**
 * Stock splits, inferred from restatements: when a later filing reports a
 * period's share count as a clean multiple of the original, a split happened
 * before that later filing. Values originally filed before the split are then
 * scaled so the whole history is on today's share basis, as vendors show it.
 */
function detectSplits(gaap: NonNullable<NonNullable<CompanyFacts['facts']>['us-gaap']>): SplitEvent[] {
  const events: SplitEvent[] = []
  for (const tag of SHARE_TAGS) {
    const byKey = new Map<string, XbrlFact[]>()
    for (const r of gaap[tag]?.units?.shares ?? []) {
      if (!FILING_FORMS.has(r.form) || !(r.val > 0)) continue
      const key = `${r.start ?? ''}|${r.end}`
      byKey.set(key, [...(byKey.get(key) ?? []), r])
    }
    for (const rows of byKey.values()) {
      rows.sort((a, b) => (a.filed < b.filed ? -1 : 1))
      for (let i = 1; i < rows.length; i++) {
        const raw = rows[i].val / rows[i - 1].val
        const ratio = raw >= 1 ? Math.round(raw) : 1 / Math.round(1 / raw)
        const clean = Math.abs(raw - ratio) / ratio < 0.02
        if (clean && ratio !== 1 && (ratio >= 2 || ratio <= 0.5)) {
          events.push({ ratio, from: rows[i].filed })
        }
      }
    }
  }
  // One split shows up in many periods and both tags; keep its earliest sighting.
  events.sort((a, b) => (a.from < b.from ? -1 : 1))
  return events.filter(
    (e, i) => !events.slice(0, i).some((p) => p.ratio === e.ratio && days(p.from, e.from) < 400),
  )
}

/** Shares-per-old-share multiplier for a value first filed on `filed`. */
function splitFactor(index: Index, filed: string | undefined): number {
  if (!filed) return 1
  return index.splits.filter((s) => s.from > filed).reduce((f, s) => f * s.ratio, 1)
}

function buildIndex(facts: CompanyFacts): Index {
  const gaap = facts.facts?.['us-gaap'] ?? {}
  const wanted = new Set<string>(Object.values(F).flatMap((f) => f.tags))
  const index = new Map() as Index
  index.annualKeys = new Set()
  index.filed = new Map()
  index.splits = detectSplits(gaap)

  for (const tag of wanted) {
    const units = gaap[tag]?.units
    if (!units) continue
    const kinds = Object.values(F).filter((f) => (f.tags as string[]).includes(tag)).map((f) => UNIT[f.kind])
    const rows = kinds.flatMap((u) => units[u] ?? [])

    // Original filing wins: earliest filed 10-K/10-Q for each period.
    const best = new Map<string, XbrlFact>()
    for (const r of rows) {
      if (!FILING_FORMS.has(r.form) || !isFinite(r.val)) continue
      const key = `${r.start ?? ''}|${r.end}`
      const prev = best.get(key)
      if (!prev || r.filed < prev.filed) best.set(key, r)
      if (r.form.startsWith('10-K') && r.start && isYear(r.start, r.end)) index.annualKeys.add(key)
    }
    index.set(tag, new Map([...best].map(([k, r]) => [k, r.val])))
    index.filed.set(tag, new Map([...best].map(([k, r]) => [k, r.filed])))
  }
  return index
}

/** Put share counts and per-share values on the current (post-split) basis. */
function adjust(index: Index, field: FieldKey, tag: string, key: string, v: number): number {
  const kind = F[field].kind
  if (kind !== 'shares' && kind !== 'perShare') return v
  const factor = splitFactor(index, index.filed.get(tag)?.get(key))
  return kind === 'shares' ? v * factor : v / factor
}

/** Value of a field for a duration (start..end) or an instant (end only). */
function lookup(index: Index, field: FieldKey, start: string | null, end: string): number | null {
  const spec: FieldSpec = F[field]
  const key = `${start ?? ''}|${end}`
  for (const tag of spec.tags) {
    const raw = index.get(tag)?.get(key)
    if (raw == null) continue
    const v = adjust(index, field, tag, key, raw)
    return spec.negate ? -v : v
  }
  return null
}

/** A flow over exactly one quarter (start unknown): any 80–100 day fact ending `end`. */
function lookupQuarter(index: Index, field: FieldKey, end: string): number | null {
  const spec: FieldSpec = F[field]
  for (const tag of spec.tags) {
    const m = index.get(tag)
    if (!m) continue
    for (const [key, raw] of m) {
      const [start, e] = key.split('|')
      if (e !== end || !start || !isQuarter(start, end)) continue
      const v = adjust(index, field, tag, key, raw)
      return spec.negate ? -v : v
    }
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Parse
 * ------------------------------------------------------------------ */

interface FiscalYear {
  start: string
  end: string
  /** Q1–Q3 period ends, ascending. Empty when the 10-Qs are incomplete. */
  quarterEnds: string[]
}

function fiscalYears(index: Index): FiscalYear[] {
  const byEnd = new Map<string, string>()
  for (const tag of ANCHOR_TAGS) {
    for (const key of index.get(tag)?.keys() ?? []) {
      const [start, end] = key.split('|')
      // 10-K only: some companies (Amazon) also file trailing-twelve-month
      // figures in 10-Qs, which are full-year durations but not fiscal years.
      if (index.annualKeys.has(key) && !byEnd.has(end)) byEnd.set(end, start)
    }
  }

  return [...byEnd]
    .map(([end, start]) => {
      // Quarter ends inside this fiscal year: any anchor flow that is either a
      // single quarter or a year-to-date run from the fiscal-year start.
      const ends = new Set<string>()
      for (const tag of ANCHOR_TAGS) {
        for (const key of index.get(tag)?.keys() ?? []) {
          const [s, e] = key.split('|')
          if (!s || e <= start || e >= end) continue
          if (isQuarter(s, e) || s === start) ends.add(e)
        }
      }
      const sorted = [...ends].sort()
      // Exactly three interim ends ~a quarter apart, or we do not trust them.
      const ok =
        sorted.length === 3 &&
        [start, ...sorted, end].every((d, i, a) => i === 0 || (days(a[i - 1], d) >= 75 && days(a[i - 1], d) <= 120))
      return { start, end, quarterEnds: ok ? sorted : [] }
    })
    .sort((a, b) => (a.end < b.end ? 1 : -1))
}

const isoPlusDays = (iso: string, n: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)

/**
 * The fiscal year in progress: no 10-K yet, but its 10-Qs are filed. It starts
 * the day after the last 10-K year ended; its quarters are the interim period
 * ends that follow, a quarter apart. Without this the newest quarters — the
 * ones that matter most — would only exist once the annual report lands.
 */
function currentYear(index: Index, lastEnd: string): { start: string; label: number; quarterEnds: string[] } | null {
  const start = isoPlusDays(lastEnd, 1)
  const ends = new Set<string>()
  for (const tag of ANCHOR_TAGS) {
    for (const key of index.get(tag)?.keys() ?? []) {
      const [s, e] = key.split('|')
      if (!s || e <= lastEnd) continue
      if (isQuarter(s, e) || s === start) ends.add(e)
    }
  }
  const quarterEnds: string[] = []
  let prev = start
  for (const e of [...ends].sort()) {
    const gap = days(prev, e)
    if (gap < 75 || gap > 120 || quarterEnds.length === 3) break
    quarterEnds.push(e)
    prev = e
  }
  if (quarterEnds.length === 0) return null
  return { start, label: fiscalYearLabel(isoPlusDays(lastEnd, 364)), quarterEnds }
}

function emptyPeriod(symbol: string, period: string, fiscalYear: number, periodEnd: string): FinancialPeriod {
  return {
    symbol,
    period,
    fiscalYear,
    periodEnd,
    reportedCurrency: 'USD',
    revenue: null,
    costOfRevenue: null,
    grossProfit: null,
    operatingExpenses: null,
    operatingIncome: null,
    ebitda: null,
    interestExpense: null,
    incomeTax: null,
    netIncome: null,
    eps: null,
    epsDiluted: null,
    sharesBasic: null,
    sharesDiluted: null,
    cashAndEquivalents: null,
    shortTermInvestments: null,
    inventory: null,
    totalCurrentAssets: null,
    totalAssets: null,
    totalCurrentLiabilities: null,
    shortTermDebt: null,
    longTermDebt: null,
    totalDebt: null,
    totalLiabilities: null,
    totalEquity: null,
    operatingCashFlow: null,
    capitalExpenditure: null,
    freeCashFlow: null,
    dividendsPaid: null,
    shareBuybacks: null,
  }
}

const sum = (...xs: Array<number | null>) =>
  xs.some((x) => x != null) ? xs.reduce<number>((a, x) => a + (x ?? 0), 0) : null

/**
 * Assemble one period from a field getter. Derived lines follow the primary
 * vendor's definitions so SEC-filled years line up with FMP-filled ones:
 * total debt is borrowings plus leases, EBITDA is pre-tax income + interest +
 * depreciation, FCF is operating cash flow less capex.
 */
function assemble(base: FinancialPeriod, get: (f: FieldKey) => number | null): FinancialPeriod {
  const p = { ...base }
  p.revenue = get('revenue')
  p.costOfRevenue = get('costOfRevenue')
  p.grossProfit =
    get('grossProfit') ?? (p.revenue != null && p.costOfRevenue != null ? p.revenue - p.costOfRevenue : null)
  p.operatingIncome = get('operatingIncome')
  p.operatingExpenses =
    get('operatingExpenses') ??
    (p.grossProfit != null && p.operatingIncome != null ? p.grossProfit - p.operatingIncome : null)
  p.interestExpense = get('interestExpense')
  p.incomeTax = get('incomeTax')
  p.netIncome = get('netIncome')
  p.eps = get('eps')
  p.epsDiluted = get('epsDiluted')
  p.sharesBasic = get('sharesBasic')
  p.sharesDiluted = get('sharesDiluted')

  const da = get('depreciation')
  const pretax = get('pretaxIncome')
  p.ebitda =
    pretax != null && da != null
      ? pretax + Math.abs(p.interestExpense ?? 0) + da
      : p.operatingIncome != null && da != null
        ? p.operatingIncome + da
        : null

  p.cashAndEquivalents = get('cashAndEquivalents')
  p.shortTermInvestments = get('shortTermInvestments')
  p.inventory = get('inventory')
  p.totalCurrentAssets = get('totalCurrentAssets')
  p.totalAssets = get('totalAssets')
  p.totalCurrentLiabilities = get('totalCurrentLiabilities')
  p.totalEquity = get('totalEquity')
  p.totalLiabilities = get('totalLiabilities')

  p.shortTermDebt = sum(get('debtCurrent'), get('commercialPaper'), get('shortTermBorrowings'))
  const ltTotal = get('longTermDebtTotal')
  p.longTermDebt =
    get('longTermDebt') ?? (ltTotal != null ? ltTotal - (get('debtCurrent') ?? 0) : null)
  // Borrowings plus lease liabilities — FMP's usual definition (it matches on
  // about half the overlapping periods; FMP itself is not consistent about
  // leases, so no rule matches it everywhere).
  const leases = get('leaseTotal') ?? sum(get('leaseCurrent'), get('leaseNoncurrent'))
  p.totalDebt = sum(p.shortTermDebt, p.longTermDebt, leases, get('financeLease'))

  p.operatingCashFlow = get('operatingCashFlow')
  p.capitalExpenditure = get('capitalExpenditure')
  p.freeCashFlow =
    p.operatingCashFlow != null && p.capitalExpenditure != null
      ? p.operatingCashFlow + p.capitalExpenditure
      : null
  p.dividendsPaid = get('dividendsPaid')
  p.shareBuybacks = get('shareBuybacks')
  return p
}

/**
 * Quarter rows for one fiscal year starting `start`, with quarter ends `ends`
 * (Q1, Q2, … in order; a completed year's last end is the fiscal year end).
 * A flow is the 3-month value when filed, else year-to-date minus the
 * previous year-to-date. Per-share values and share counts are not additive,
 * so they are only taken when filed.
 */
function quarterRows(index: Index, symbol: string, label: number, start: string, ends: string[]): FinancialPeriod[] {
  // Year-to-date at quarter k (0 = before the year starts).
  const ytd = (f: FieldKey, k: number): number | null => {
    if (k === 0) return 0
    const direct = lookup(index, f, start, ends[k - 1])
    if (direct != null) return direct
    const prev = ytd(f, k - 1)
    const q = lookupQuarter(index, f, ends[k - 1])
    return prev != null && q != null ? prev + q : null
  }

  return ends.map((end, i) => {
    const k = i + 1
    return assemble(emptyPeriod(symbol, `Q${k}`, label, end), (f) => {
      const kind = F[f].kind
      if (kind === 'instant') return lookup(index, f, null, end)
      const quarter = lookupQuarter(index, f, end)
      if (quarter != null) return quarter
      if (kind !== 'flow') return null
      const now = ytd(f, k)
      const before = ytd(f, k - 1)
      return now != null && before != null ? now - before : null
    })
  })
}

/** Statements newest first, in the same shape the primary vendor produces. */
export function parseCompanyFacts(
  symbol: string,
  facts: CompanyFacts,
): { annual: FinancialPeriod[]; quarterly: FinancialPeriod[] } {
  const index = buildIndex(facts)
  const years = fiscalYears(index)
  const annual: FinancialPeriod[] = []
  const quarterly: FinancialPeriod[] = []

  for (const fy of years) {
    const label = fiscalYearLabel(fy.end)

    const yearRow = assemble(emptyPeriod(symbol, 'FY', label, fy.end), (f) =>
      F[f].kind === 'instant' ? lookup(index, f, null, fy.end) : lookup(index, f, fy.start, fy.end),
    )
    // A year with neither revenue nor net income is a stray fact, not a year.
    if (yearRow.revenue == null && yearRow.netIncome == null) continue
    annual.push(yearRow)

    if (fy.quarterEnds.length !== 3) continue
    const ends = [...fy.quarterEnds, fy.end]
    quarterly.push(...quarterRows(index, symbol, label, fy.start, ends))

    // Q4 share counts and EPS are never filed on their own. A year's weighted
    // average share count is (to within rounding) the mean of its four
    // quarterly averages, so Q4 = 4 × year − (Q1 + Q2 + Q3); Q4 EPS then
    // follows from Q4 net income. Without this every TTM EPS window that
    // touches an SEC-only Q4 would be blank.
    const qs = quarterly.slice(-4) // this fiscal year's Q1..Q4, in push order
    const q4 = qs[3]
    for (const [shares, eps] of [
      ['sharesDiluted', 'epsDiluted'],
      ['sharesBasic', 'eps'],
    ] as const) {
      const year = yearRow[shares]
      const firstThree = qs.slice(0, 3).map((q) => q[shares])
      if (q4[shares] == null && year != null && firstThree.every((v) => v != null)) {
        const derived = 4 * year - firstThree.reduce((a, v) => a + v!, 0)
        if (derived > 0) {
          q4[shares] = derived
          if (q4[eps] == null && q4.netIncome != null) q4[eps] = q4.netIncome / derived
        }
      }
    }
  }

  // Quarters of the year in progress (Q1–Q3 filed on 10-Qs, no 10-K yet).
  const cur = years.length > 0 ? currentYear(index, years[0].end) : null
  if (cur) {
    quarterly.push(...quarterRows(index, symbol, cur.label, cur.start, cur.quarterEnds))
  }

  quarterly.sort((a, b) => (a.periodEnd < b.periodEnd ? 1 : -1))
  return { annual, quarterly }
}

/* ------------------------------------------------------------------ *
 * Merge with the primary vendor
 * ------------------------------------------------------------------ */

/**
 * History rows for periods the primary vendor did not return. A history row is
 * dropped when a primary row ends within 10 days of it (same period, possibly
 * dated a day apart by a 52/53-week calendar), so the vendor's row stays the
 * single source for that period. Result newest first, capped at `limit`.
 */
export function olderHistory(
  primary: FinancialPeriod[],
  history: FinancialPeriod[],
  limit: number,
): FinancialPeriod[] {
  const taken = primary.map((p) => Date.parse(p.periodEnd))
  const room = Math.max(0, limit - primary.length)
  return history
    .filter((h) => !taken.some((t) => Math.abs(t - Date.parse(h.periodEnd)) <= 10 * DAY))
    .sort((a, b) => (a.periodEnd < b.periodEnd ? 1 : -1))
    .slice(0, room)
}

/* ------------------------------------------------------------------ *
 * Client
 * ------------------------------------------------------------------ */

export interface SecHistoryOptions {
  /** SEC asks automated clients to identify themselves: "app-name contact@domain". */
  userAgent?: string
  onVendorCall?: () => void
}

export class SecHistorySource {
  readonly name = 'sec'
  private readonly userAgent: string
  private readonly onVendorCall?: () => void
  // SEC fair-access limit is 10 requests/second; stay well under it.
  private readonly limiter = new RateLimiter(4, 4)

  constructor(opts: SecHistoryOptions = {}) {
    this.userAgent = opts.userAgent ?? process.env.SEC_USER_AGENT ?? 'finlens/1.0'
    this.onVendorCall = opts.onVendorCall
  }

  async getHistory(symbol: string, cik: string) {
    const padded = cik.replace(/\D/g, '').padStart(10, '0')
    const facts = await fetchJson<CompanyFacts>(`${BASE}/CIK${padded}.json`, {
      limiter: this.limiter,
      onAttempt: this.onVendorCall,
      headers: { 'user-agent': this.userAgent },
      timeoutMs: 30_000,
    })
    return parseCompanyFacts(symbol.toUpperCase(), facts)
  }
}
