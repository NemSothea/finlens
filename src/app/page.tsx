import Link from 'next/link'
import { SearchBox } from '@/components/search-box'
import { auth } from '@/auth'
import { getCompanyRows, POPULAR_SYMBOLS } from '@/lib/queries/stocks'
import { listWatchedSymbols } from '@/lib/queries/user'
import {
  formatCurrencyCompact,
  formatFairValue,
  formatPrice,
  NOT_MEANINGFUL,
  NOT_MEANINGFUL_REASON,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'
import { Suspense } from 'react'
import { LoadingShell, Reveal, Skeleton, TableSkeleton } from '@/components/skeleton'

/**
 * The table is personal: your watchlist when you have one, otherwise a fixed
 * popular list. It never lists "everything loaded", because with load-on-open
 * that is just whatever other visitors happened to look up. Reading the session
 * makes the page dynamic, so there is no ISR here.
 */
export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Invest in businesses, not tickers.
          </h1>
          <p className="text-zinc-500">
            Years of financials straight from SEC filings, the ratios that matter, and a
            disciplined intrinsic-value estimate — for any US-listed company.
          </p>
        </div>

        <div className="max-w-2xl">
          <SearchBox autoFocus />
        </div>
      </section>

      <Suspense fallback={<HomeTableSkeleton />}>
        <HomeTable />
      </Suspense>
    </div>
  )
}

/** The personal part of the page — waits on the session and Firestore, so it
 *  streams in behind a skeleton while the search box is already usable. */
async function HomeTable() {
  const session = await auth()
  const watched = session?.user?.id ? await listWatchedSymbols(session.user.id) : []
  const showingWatchlist = watched.length > 0
  const covered = await getCompanyRows(showingWatchlist ? watched : POPULAR_SYMBOLS)

  return (
    <Reveal>
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {showingWatchlist ? 'Your watchlist' : 'Popular companies'}
          </h2>
          {showingWatchlist ? (
            <Link href="/watchlist" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
              Manage watchlist
            </Link>
          ) : (
            <span className="text-sm text-zinc-500">
              {session?.user ? 'Add companies to your watchlist to see them here' : 'Search to open any US-listed company'}
            </span>
          )}
        </div>

        {covered.length === 0 ? (
          // Empty is its own state, with the action that resolves it — not a
          // blank table that reads as a broken page.
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              Nothing loaded here yet. Search for a company above — it loads the first time you
              open it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Day</th>
                  <th className="px-4 py-3 text-right font-medium">Market cap</th>
                  <th className="px-4 py-3 text-right font-medium">DCF fair value</th>
                  <th className="px-4 py-3 text-right font-medium">Margin of safety</th>
                </tr>
              </thead>
              <tbody>
                {covered.map((c, i) => (
                  <tr
                    key={c.symbol}
                    style={{ '--i': Math.min(i, 12) } as React.CSSProperties}
                    className="motion-rise border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/stocks/${c.symbol}`}
                        className="font-mono font-semibold underline-offset-4 hover:underline"
                      >
                        {c.symbol}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-500">{c.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatPrice(c.price)}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${toneForSigned(
                        c.dayChangePct == null ? null : c.dayChangePct / 100,
                      )}`}
                    >
                      {c.dayChangePct == null ? MISSING : `${c.dayChangePct.toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-500">
                      {formatCurrencyCompact(c.marketCap)}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      title={formatFairValue(c.fairValuePerShare) === NOT_MEANINGFUL ? NOT_MEANINGFUL_REASON : undefined}
                    >
                      {formatFairValue(c.fairValuePerShare)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${toneForSigned(
                        c.marginOfSafetyPct,
                      )}`}
                    >
                      {formatSignedPercent(c.marginOfSafetyPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          Fair values use default assumptions: trailing-twelve-month cash flow to the firm, 8%
          growth fading to 2.5%, discounted at each company&apos;s WACC. Tune them on the detail page.
        </p>
      </section>
    </Reveal>
  )
}

function HomeTableSkeleton() {
  return (
    <LoadingShell label="Loading companies">
      <div className="mb-4 flex justify-between">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>
      <TableSkeleton rows={7} cols={7} />
    </LoadingShell>
  )
}
