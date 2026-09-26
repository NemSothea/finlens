import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MetricCard, SectionHeading } from '@/components/metric-card'
import { CashFlowChart, FinancialsChart } from '@/components/financials-chart'
import { PriceChart } from '@/components/price-chart'
import { DcfPanel } from '@/components/dcf-panel'
import { WatchButton } from '@/components/watch-button'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { getCurrentUserAndEntitlement } from '@/lib/queries/billing'
import { isWatched } from '@/lib/queries/user'
import { getPriceSeries, getStatements, getStockSnapshot } from '@/lib/queries/stocks'
import { deriveDcfInputs, describeFailure } from '@/lib/valuation/inputs'
import { ratio } from '@/lib/metrics'
import {
  formatCurrencyCompact,
  formatMultiple,
  formatNumber,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'

export async function generateMetadata(
  props: PageProps<'/stocks/[symbol]'>,
): Promise<Metadata> {
  const { symbol } = await props.params
  const snapshot = await getStockSnapshot(symbol)

  if (!snapshot) return { title: `${symbol.toUpperCase()} — not covered | finlens` }

  return {
    title: `${snapshot.company.symbol} — ${snapshot.company.name} | finlens`,
    description: `Fundamentals, financial history and intrinsic value for ${snapshot.company.name}.`,
  }
}

export default async function StockDetailPage(props: PageProps<'/stocks/[symbol]'>) {
  const { symbol } = await props.params

  const { userId, entitlement } = await getCurrentUserAndEntitlement()
  const { limits } = entitlement

  // History depth comes from the plan, and it is applied to the QUERY — a free
  // user's extra years are never fetched, so they cannot be recovered from the
  // page payload or the RSC stream. Blurring rows client-side would ship the
  // data and hide it with CSS.
  // The chart itself is capped at 2 years even on Pro so daily closes stay
  // readable — Pro's full history is what the JSON API returns, not this widget.
  const chartPriceDays = Math.min(365 * 2, limits.priceHistoryDays)

  const [snapshot, statements, prices, watched] = await Promise.all([
    getStockSnapshot(symbol),
    getStatements(symbol, 'FY', limits.financialYears),
    getPriceSeries(symbol, chartPriceDays),
    userId ? isWatched(userId, symbol) : Promise.resolve(false),
  ])

  if (!snapshot) notFound()

  const { company, quote, valuation, latest, metrics } = snapshot
  const currency = company.currency ?? 'USD'

  // Derived on the server so the panel's first paint is already correct — no
  // loading flash, and no assumptions round trip before the user sees a number.
  const derived = deriveDcfInputs(statements, quote)

  const financialsData = statements.map((s) => ({
    fiscalYear: s.fiscalYear,
    revenue: s.revenue,
    netIncome: s.netIncome,
    ebitda: s.ebitda,
    freeCashFlow: s.freeCashFlow,
    netMargin: ratio(s.netIncome, s.revenue),
  }))

  const cashFlowData = statements.map((s) => ({
    fiscalYear: s.fiscalYear,
    operatingCashFlow: s.operatingCashFlow,
    capitalExpenditure: s.capitalExpenditure,
    freeCashFlow: s.freeCashFlow,
  }))

  return (
    <div className="space-y-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{company.symbol}</h1>
            {company.exchange && (
              <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-800">
                {company.exchange}
              </span>
            )}
          </div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">{company.name}</p>
          <p className="text-sm text-zinc-500">
            {[company.sector, company.industry, company.country].filter(Boolean).join(' · ') ||
              'Sector not classified'}
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-3xl font-semibold">
            {formatPrice(quote?.price, currency)}
          </div>
          <div
            className={`font-mono text-sm ${toneForSigned(
              quote?.dayChangePct == null ? null : quote.dayChangePct / 100,
            )}`}
          >
            {quote?.dayChangePct == null ? MISSING : `${quote.dayChangePct.toFixed(2)}% today`}
          </div>
          {quote?.asOf && (
            <div className="mt-1 text-xs text-zinc-400">
              as of {quote.asOf.slice(0, 10)}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <WatchButton
              symbol={company.symbol}
              initiallyWatched={watched}
              signedIn={Boolean(userId)}
            />
          </div>
        </div>
      </section>

      {/* ── Valuation ──────────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Intrinsic value"
          subtitle="Two-stage DCF on normalised free cash flow. Move the assumptions — a fair value you cannot interrogate is not worth acting on."
        />

        <p className="mb-4 text-xs text-zinc-500">
          Trailing P/E {formatMultiple(quote?.peRatio)}
          {valuation &&
            ` · nightly cached fair value ${formatPrice(valuation.fairValuePerShare, currency)} at ${formatSignedPercent(valuation.marginOfSafetyPct)} margin of safety, computed ${valuation.computedAt.slice(0, 10)}`}
        </p>

        {derived.ok && !limits.interactiveValuation ? (
          // Free users still see the number — the gate is on tuning the model,
          // not on knowing what it says. Withholding the headline figure would
          // make the free tier useless rather than merely limited.
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="DCF fair value"
                value={formatPrice(valuation?.fairValuePerShare, currency)}
                hint="default assumptions"
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
            initialAssumptions={derived.inputs.assumptions}
            warnings={derived.inputs.warnings}
            fcfYearsUsed={derived.inputs.fcfYearsUsed}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
            No valuation possible for {company.symbol}. {describeFailure(derived.reason)}
          </div>
        )}
      </section>

      {/* ── Price ──────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Price"
          subtitle={
            chartPriceDays < 365 * 2
              ? `Daily closes, last ${Math.round(chartPriceDays / 365) || 1} year${chartPriceDays > 500 ? 's' : ''}. Pro shows two.`
              : 'Daily closes, last two years.'
          }
        />
        <PriceChart data={prices} fairValue={valuation?.fairValuePerShare ?? null} />
      </section>

      {/* ── Quality ────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Quality and returns"
          subtitle={`Latest fiscal year${latest ? ` — FY ${latest.fiscalYear}` : ''}.`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Gross margin" value={formatPercent(metrics.grossMargin)} hint="Gross profit ÷ revenue" />
          <MetricCard label="Operating margin" value={formatPercent(metrics.operatingMargin)} hint="Operating income ÷ revenue" />
          <MetricCard label="Net margin" value={formatPercent(metrics.netMargin)} hint="Net income ÷ revenue" />
          <MetricCard label="FCF margin" value={formatPercent(metrics.fcfMargin)} hint="Free cash flow ÷ revenue" />
          <MetricCard label="Return on equity" value={formatPercent(metrics.returnOnEquity)} hint="Net income ÷ shareholders' equity" />
          <MetricCard label="Return on assets" value={formatPercent(metrics.returnOnAssets)} hint="Net income ÷ total assets" />
          <MetricCard label="Current ratio" value={formatMultiple(metrics.currentRatio)} hint="Current assets ÷ current liabilities" />
          <MetricCard
            label="Debt / equity"
            value={formatMultiple(metrics.debtToEquity)}
            hint="Total debt ÷ equity"
            tone={metrics.debtToEquity != null && metrics.debtToEquity > 2 ? 'text-amber-500' : undefined}
          />
        </div>
      </section>

      {/* ── Growth ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading title="Growth" subtitle="Compound annual rates over the last five fiscal years." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Revenue CAGR 5y" value={formatPercent(metrics.revenueCagr5y)} tone={toneForSigned(metrics.revenueCagr5y)} />
          <MetricCard label="Revenue YoY" value={formatSignedPercent(metrics.revenueYoy)} tone={toneForSigned(metrics.revenueYoy)} />
          <MetricCard label="Net income CAGR 5y" value={formatPercent(metrics.netIncomeCagr5y)} tone={toneForSigned(metrics.netIncomeCagr5y)} />
          <MetricCard label="Free cash flow CAGR 5y" value={formatPercent(metrics.fcfCagr5y)} tone={toneForSigned(metrics.fcfCagr5y)} />
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading
          title="Financial history"
          subtitle={
            limits.financialYears < 30
              ? `${statements.length} fiscal years shown. Your plan shows ${limits.financialYears} — Pro shows 30.`
              : `${statements.length} fiscal years ingested.`
          }
        />
        <FinancialsChart data={financialsData} />
      </section>

      <section>
        <SectionHeading title="Cash flow" subtitle="Operating cash flow, capital expenditure and what is left over." />
        <CashFlowChart data={cashFlowData} />
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
  )
}
