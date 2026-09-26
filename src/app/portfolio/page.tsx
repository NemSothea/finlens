import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getOrCreateDefaultPortfolio, getPortfolioDetail } from '@/lib/queries/user'
import { deleteTransaction } from '@/app/actions/portfolio'
import { MetricCard, SectionHeading } from '@/components/metric-card'
import { TransactionForm } from '@/components/transaction-form'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import { getEntitlementForUser } from '@/lib/queries/billing'
import {
  formatNumber,
  formatPercent,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'

export const metadata = { title: 'Portfolio | finlens' }

function PortfolioLocked() {
  return (
    <div className="mx-auto max-w-lg space-y-5 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Portfolio tracking is Pro</h1>
      <p className="text-sm text-zinc-500">
        Record trades and let finlens derive positions, cost basis and returns from the log —
        no spreadsheet, no manual balances.
      </p>
      <UpgradePrompt feature="Portfolio tracking, unlimited watchlist, 30 years of financials and editable valuation assumptions" />
    </div>
  )
}

export default async function PortfolioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  // Re-checked here, not just in the proxy. Next's own docs warn that a matcher
  // change can silently drop proxy coverage, so the page owns its own gate.
  const entitlement = await getEntitlementForUser(session.user.id)
  if (!entitlement.limits.portfolio) return <PortfolioLocked />

  const portfolio = await getOrCreateDefaultPortfolio(session.user.id)
  const detail = await getPortfolioDetail(session.user.id, portfolio.id)

  if (!detail) redirect('/signin')

  const { summary, transactions } = detail
  const currency = portfolio.baseCurrency

  return (
    <div className="space-y-10">
      <SectionHeading
        title={portfolio.name}
        subtitle="Positions are derived from your trade log on every load — nothing is stored as a balance."
      />

      {/* ── Totals ─────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Market value"
          value={formatPrice(summary.totalMarketValue, currency)}
          hint={
            summary.unpricedSymbols.length > 0
              ? `excludes ${summary.unpricedSymbols.join(', ')} — no quote`
              : 'all holdings priced'
          }
        />
        <MetricCard
          label="Cost basis"
          value={formatPrice(summary.totalCostBasis, currency)}
          hint="fees included"
        />
        <MetricCard
          label="Unrealized"
          value={formatPrice(summary.totalUnrealizedGain, currency)}
          tone={toneForSigned(summary.totalUnrealizedGain)}
          hint="open positions only"
        />
        <MetricCard
          label="Total return"
          value={formatSignedPercent(summary.totalReturnPct)}
          tone={toneForSigned(summary.totalReturnPct)}
          hint={`incl. ${formatPrice(summary.totalRealizedGain, currency)} realized, ${formatPrice(summary.totalDividendIncome, currency)} dividends`}
        />
      </div>

      {summary.warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {summary.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {/* ── Positions ──────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Positions</h2>

        {summary.positions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No open positions. Record a buy below to get started.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 text-right font-medium">Shares</th>
                  <th className="px-4 py-3 text-right font-medium">Avg cost</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                  <th className="px-4 py-3 text-right font-medium">Unrealized</th>
                  <th className="px-4 py-3 text-right font-medium">Weight</th>
                </tr>
              </thead>
              <tbody>
                {summary.positions.map((p) => (
                  <tr
                    key={p.symbol}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/stocks/${p.symbol}`}
                        className="font-mono font-semibold underline-offset-4 hover:underline"
                      >
                        {p.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(p.quantity)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(p.averageCost, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(p.price, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(p.marketValue, currency)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${toneForSigned(p.unrealizedGain)}`}
                    >
                      {formatPrice(p.unrealizedGain, currency)}
                      <span className="ml-2 text-xs">
                        {formatSignedPercent(p.unrealizedGainPct)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-500">
                      {formatPercent(p.weight)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Entry ──────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Record a trade</h2>
        <TransactionForm portfolioId={portfolio.id} />
      </section>

      {/* ── Log ────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Trade log</h2>

        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Fees</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                    <td className="px-4 py-2.5 font-mono text-zinc-500">
                      {t.tradedAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-2.5 font-mono">{t.symbol}</td>
                    <td className="px-4 py-2.5 capitalize">{t.kind}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNumber(t.quantity)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {t.kind === 'split' ? MISSING : formatPrice(t.pricePerShare, t.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-500">
                      {formatPrice(t.fees, t.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <form
                        action={async () => {
                          'use server'
                          await deleteTransaction({ portfolioId: portfolio.id, id: t.id })
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-zinc-400 underline underline-offset-4 transition hover:text-rose-500"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          Deleting a trade recomputes every position from what remains. Cost basis uses average
          cost, not FIFO.
        </p>
      </section>
    </div>
  )
}
