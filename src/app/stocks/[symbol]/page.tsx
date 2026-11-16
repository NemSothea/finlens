import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MetricCard, SectionHeading } from '@/components/metric-card'
import { StatCard } from '@/components/stat-card'
import { FundamentalsGrid } from '@/components/fundamentals-grid'
import { DcfPanel } from '@/components/dcf-panel'
import { WatchButton } from '@/components/watch-button'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { getCurrentUserAndEntitlement } from '@/lib/queries/billing'
import { isWatched } from '@/lib/queries/user'
import { getPriceSeries, getStatements, getStockSnapshot } from '@/lib/queries/stocks'
import { deriveDcfInputs, describeFailure } from '@/lib/valuation/inputs'
import { ensureCovered, type CoverageResult } from '@/lib/ingest/on-demand'
import { buildFundamentalSeries } from '@/lib/fundamentals'
import {
  NOT_MEANINGFUL,
  formatCurrencyCompact,
  formatFairValue,
  formatMultiple,
  formatNumber,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
} from '@/lib/format'
import { Reveal } from '@/components/skeleton'
import { StockPageSkeleton } from '@/components/stock-skeleton'
import { Suspense } from 'react'
import { refs } from '@/db/schema'
import { lookupSymbol } from '@/lib/providers/sec-directory'

export async function generateMetadata(
  props: PageProps<'/stocks/[symbol]'>,
): Promise<Metadata> {
  const { symbol } = await props.params
  const snapshot = await getStockSnapshot(symbol)

  // Not loaded yet — the page loads it on this visit, so do not call it uncovered.
  if (!snapshot) return { title: `${symbol.toUpperCase()} | finlens` }

  return {
    title: `${snapshot.company.symbol} — ${snapshot.company.name} | finlens`,
    description: `Fundamentals, financial history and intrinsic value for ${snapshot.company.name}.`,
  }
}

/**
 * The page answers "does this ticker exist?" BEFORE anything streams, so an
 * unknown ticker gets a real 404 status. Everything slow — reading the
 * company, or loading it from SEC and the vendor on a first visit — happens
 * inside the Suspense boundary, behind the skeleton. (A route-level
 * loading.tsx would stream first and turn every notFound() into a 200.)
 */
export default async function StockDetailPage(props: PageProps<'/stocks/[symbol]'>) {
  const { symbol } = await props.params
  if (!(await refs.company(symbol).get()).exists && !(await lookupSymbol(symbol))) notFound()

  return (
    <Suspense fallback={<StockPageSkeleton />}>
      <StockDetail symbol={symbol} />
    </Suspense>
  )
}

async function StockDetail({ symbol }: { symbol: string }) {
  const { userId, entitlement } = await getCurrentUserAndEntitlement()
  const { limits } = entitlement

  // History depth comes from the plan, and it is applied to the QUERY — a free
  // user's extra years are never fetched, so they cannot be recovered from the
  // page payload or the RSC stream. Blurring rows client-side would ship the
  // data and hide it with CSS.
  // Price chart history is capped at 10 years; the grid thins long series.
  const chartPriceDays = Math.min(365 * 10, limits.priceHistoryDays)

  const read = () =>
    Promise.all([
      getStockSnapshot(symbol),
      getStatements(symbol, 'FY', limits.financialYears),
      getStatements(symbol, 'Q', Math.min(40, limits.financialYears * 4)),
      getPriceSeries(symbol, chartPriceDays),
      userId ? isWatched(userId, symbol) : Promise.resolve(false),
    ])

  let [snapshot, statements, quarters, prices, watched] = await read()

  // Not loaded yet: fetch it now. The route's loading skeleton covers the
  // few seconds this takes, and every later visit reads the stored copy.
  if (!snapshot || statements.length === 0) {
    const coverage = await ensureCovered(symbol)
    if (coverage.status === 'ready') {
      ;[snapshot, statements, quarters, prices, watched] = await read()
    } else if (coverage.status === 'unknown') {
      notFound()
    } else {
      return <NotLoaded symbol={symbol.toUpperCase()} coverage={coverage} />
    }
  }

  if (!snapshot) notFound()

  const { company, quote, valuation, basis, metrics } = snapshot
  const currency = company.currency ?? 'USD'
  const basisNote =
    basis.kind === 'TTM'
      ? `Trailing twelve months to ${basis.periodEnd}`
      : basis.fiscalYear != null
        ? `Fiscal year ${basis.fiscalYear}`
        : 'No statements on file'
  const span = metrics.growthYears > 0 ? `${metrics.growthYears}y` : ''
  const returns = metrics.priceReturns
  const dayChange =
    quote?.price != null && quote.previousClose != null ? quote.price - quote.previousClose : null

  // Derived on the server so the panel's first paint is already correct — no
  // loading flash, and no assumptions round trip before the user sees a number.
  const derived = deriveDcfInputs(statements, quote, { quarters, beta: company.beta })

  const series = buildFundamentalSeries(statements, quarters)

  return (
    <Reveal>
    <div className="space-y-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              <span className="font-mono text-sm text-zinc-500">{company.symbol}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-3xl font-semibold">{formatPrice(quote?.price, currency)}</span>
              {quote?.dayChangePct != null && (
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-sm ${
                    quote.dayChangePct >= 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                  }`}
                >
                  {dayChange != null && `${dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)} `}(
                  {formatSignedPercent(quote.dayChangePct / 100, 2)})
                </span>
              )}
            </div>
            {quote?.asOf && <p className="text-xs text-zinc-400">Quote as of {quote.asOf.slice(0, 10)}</p>}
            {quote?.price == null && (
              <p className="max-w-md rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Price not available on the current data plan. Financials, history and the fair
                value are shown; anything that needs the share price (P/E, margin of safety,
                returns) stays blank.
              </p>
            )}
          </div>

          <WatchButton symbol={company.symbol} initiallyWatched={watched} signedIn={Boolean(userId)} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-4 dark:border-zinc-800">
          {[
            ['Market cap', formatCurrencyCompact(quote?.marketCap, currency)],
            ['Sector', company.sector ?? '—'],
            ['Exchange', company.exchange ?? '—'],
            ['Next earnings', company.nextEarningsDate ?? 'Not announced'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
              <dd className="mt-0.5 font-mono">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Key numbers ────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          index={0}
          title="Key margins"
          footnote={basisNote}
          rows={[
            { label: 'Gross', value: formatPercent(metrics.grossMargin), hint: 'Gross profit ÷ revenue' },
            { label: 'Operating', value: formatPercent(metrics.operatingMargin), hint: 'Operating income ÷ revenue' },
            { label: 'Net', value: formatPercent(metrics.netMargin), hint: 'Net income ÷ revenue' },
            { label: 'Free cash flow', value: formatPercent(metrics.fcfMargin), hint: 'Free cash flow ÷ revenue' },
          ]}
        />
        <StatCard
          index={1}
          title="Key ratios"
          footnote={basisNote}
          rows={[
            { label: 'P/E', value: formatMultiple(quote?.peRatio), hint: 'Price ÷ diluted EPS (null on losses)' },
            { label: 'ROE', value: formatPercent(metrics.returnOnEquity), hint: "Net income ÷ shareholders' equity" },
            { label: 'ROIC', value: formatPercent(metrics.returnOnInvestedCapital), hint: 'After-tax operating income ÷ (debt + equity − cash)' },
            {
              label: 'Debt / equity',
              value: formatMultiple(metrics.debtToEquity),
              hint: 'Total debt ÷ equity',
              tone: metrics.debtToEquity != null && metrics.debtToEquity > 2 ? 'text-amber-500' : undefined,
            },
          ]}
        />
        <StatCard
          index={2}
          title="Balance sheet"
          footnote={basis.periodEnd ? `As of ${basis.periodEnd}` : undefined}
          rows={[
            { label: 'Cash & ST inv.', value: formatCurrencyCompact(metrics.cash, currency), hint: 'Cash and equivalents + short-term investments' },
            { label: 'Total debt', value: formatCurrencyCompact(metrics.totalDebt, currency) },
            { label: 'Net debt', value: formatCurrencyCompact(metrics.netDebt, currency), hint: 'Total debt − cash & short-term investments. Negative = net cash.' },
            { label: 'Current ratio', value: formatMultiple(metrics.currentRatio), hint: 'Current assets ÷ current liabilities' },
          ]}
        />
        <StatCard
          index={3}
          title="Growth"
          footnote={metrics.growthYears > 0 ? `Compound annual, ${metrics.growthYears} fiscal years` : 'Not enough annual history'}
          rows={[
            { label: `Revenue ${span}`, value: formatPercent(metrics.revenueCagr5y), tone: toneForSigned(metrics.revenueCagr5y) },
            { label: `Net income ${span}`, value: formatPercent(metrics.netIncomeCagr5y), tone: toneForSigned(metrics.netIncomeCagr5y) },
            { label: `Free cash flow ${span}`, value: formatPercent(metrics.fcfCagr5y), tone: toneForSigned(metrics.fcfCagr5y) },
            { label: 'Revenue YoY', value: formatSignedPercent(metrics.revenueYoy), tone: toneForSigned(metrics.revenueYoy) },
          ]}
        />
        <StatCard
          index={4}
          title="Share price return"
          footnote={returns.asOf ? `Close ${returns.asOf}` : undefined}
          rows={[
            { label: 'YTD', value: formatSignedPercent(returns.ytd), tone: toneForSigned(returns.ytd) },
            { label: '1 year', value: formatSignedPercent(returns.oneYear), tone: toneForSigned(returns.oneYear) },
            { label: '5 years', value: formatSignedPercent(returns.fiveYear), tone: toneForSigned(returns.fiveYear) },
            { label: '5y annualised', value: formatSignedPercent(returns.fiveYearCagr), tone: toneForSigned(returns.fiveYearCagr), hint: 'Compound annual rate of the 5-year return' },
          ]}
        />
      </section>

      {/* ── Fundamentals ───────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Fundamental overview"
          subtitle={`Each tile is one measure over time. ${
            limits.financialYears < 30 ? `Your plan includes ${limits.financialYears} years of statements — Pro includes 30.` : ''
          }`}
        />
        <FundamentalsGrid
          series={series}
          prices={prices}
          currency={currency}
          priceNote={
            limits.priceHistoryDays < 365 * 10
              ? `Chart shows up to ${Math.round(limits.priceHistoryDays / 365)} year${limits.priceHistoryDays >= 730 ? 's' : ''} of prices on your plan.`
              : undefined
          }
        />
      </section>

      {/* ── Valuation ──────────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Intrinsic value"
          subtitle="DCF on trailing or averaged cash flow, discounted at a WACC built from beta. Two- or three-stage, to the firm or to equity. Move the assumptions — a fair value you cannot interrogate is not worth acting on."
        />

        <p className="mb-4 text-xs text-zinc-500">
          Trailing P/E {formatMultiple(quote?.peRatio)}
          {valuation &&
            ` · nightly cached fair value ${formatFairValue(valuation.fairValuePerShare, currency)} at ${formatSignedPercent(valuation.marginOfSafetyPct)} margin of safety, computed ${valuation.computedAt.slice(0, 10)}`}
        </p>

        {derived.ok && !limits.interactiveValuation ? (
          // Free users still see the number — the gate is on tuning the model,
          // not on knowing what it says. Withholding the headline figure would
          // make the free tier useless rather than merely limited.
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="DCF fair value"
                value={formatFairValue(valuation?.fairValuePerShare, currency)}
                hint={
                  formatFairValue(valuation?.fairValuePerShare) === NOT_MEANINGFUL
                    ? 'negative cash flow — a DCF does not apply'
                    : 'default assumptions'
                }
              />
              <MetricCard
                label="Margin of safety"
                value={formatSignedPercent(valuation?.marginOfSafetyPct)}
                tone={toneForSigned(valuation?.marginOfSafetyPct)}
                hint="positive = below fair value"
              />
              <MetricCard
                label="Market-implied growth"
                value={formatPercent(valuation?.impliedGrowthRate)}
                hint="reverse DCF"
              />
            </div>
            <UpgradePrompt feature="Editable assumptions, sensitivity analysis and the year-by-year projection" />
          </div>
        ) : derived.ok ? (
          <DcfPanel
            symbol={company.symbol}
            currency={currency}
            price={quote?.price ?? null}
            inputs={derived.inputs}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
            No valuation possible for {company.symbol}. {describeFailure(derived.reason)}
          </div>
        )}
      </section>

      {/* ── Table ──────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Annual statements"
          subtitle={
            limits.financialYears < 30
              ? `Newest first. Your plan shows ${limits.financialYears} years — Pro shows 30.`
              : 'Newest first. Every figure as reported.'
          }
        />
        {statements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
            No annual statements ingested for {company.symbol} yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">FY</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">EBITDA</th>
                  <th className="px-4 py-3 text-right font-medium">Net income</th>
                  <th className="px-4 py-3 text-right font-medium">EPS diluted</th>
                  <th className="px-4 py-3 text-right font-medium">Op. cash flow</th>
                  <th className="px-4 py-3 text-right font-medium">Free cash flow</th>
                  <th className="px-4 py-3 text-right font-medium">Total debt</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {statements.map((s) => (
                  <tr
                    key={s.periodEnd}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-2.5">{s.fiscalYear}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrencyCompact(s.revenue, currency)}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrencyCompact(s.ebitda, currency)}</td>
                    <td className={`px-4 py-2.5 text-right ${toneForSigned(s.netIncome)}`}>
                      {formatCurrencyCompact(s.netIncome, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right">{formatNumber(s.epsDiluted)}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrencyCompact(s.operatingCashFlow, currency)}</td>
                    <td className={`px-4 py-2.5 text-right ${toneForSigned(s.freeCashFlow)}`}>
                      {formatCurrencyCompact(s.freeCashFlow, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">
                      {formatCurrencyCompact(s.totalDebt, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Profile ────────────────────────────────────────────── */}
      {company.description && (
        <section>
          <SectionHeading title="About" />
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {company.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-zinc-500">
            {company.employees != null && <span>{formatNumber(company.employees)} employees</span>}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Website
              </a>
            )}
            <Link
              href={`/compare?symbols=${company.symbol},`}
              className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Compare {company.symbol} with another company
            </Link>
          </div>
        </section>
      )}
    </div>
    </Reveal>
  )
}

/** Shown when a real ticker cannot be loaded right now — says why, and what to do. */
function NotLoaded({
  symbol,
  coverage,
}: {
  symbol: string
  coverage: Exclude<CoverageResult, { status: 'ready' } | { status: 'unknown' }>
}) {
  const message =
    coverage.status === 'budget'
      ? `${symbol} has not been loaded yet, and today's limit of ${coverage.limit} new companies is used up. It will load on the first visit tomorrow; companies already loaded stay available.`
      : coverage.status === 'unlisted'
        ? `${symbol} is not listed on a major US exchange${coverage.exchange ? ` (${coverage.exchange})` : ''}, so we do not cover it.`
        : `${symbol} could not be loaded just now (${coverage.reason}). Try again in a minute.`

  return (
    <Reveal>
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="font-mono text-2xl font-semibold">{symbol}</h1>
        <p className="text-sm text-zinc-500">{message}</p>
        <Link href="/" className="inline-block text-sm underline underline-offset-4">
          Back to search
        </Link>
      </div>
    </Reveal>
  )
}
