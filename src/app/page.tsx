import Link from 'next/link'
import { SearchBox } from '@/components/search-box'
import { getCoveredCompanies } from '@/lib/queries/stocks'
import {
  formatCurrencyCompact,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'
import { Reveal } from '@/components/skeleton'

/**
 * ISR, not static. This page reads the DB, and the ingest pipeline runs
 * nightly — prerendering it once at build time would freeze the covered-company
 * table at whatever the data looked like on deploy day.
 *
 * An hour is well inside the ingest cadence and keeps the page cheap.
 */
export const revalidate = 3600

export default async function HomePage() {
  const covered = await getCoveredCompanies(30)

  return (
    <Reveal>
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Invest in businesses, not tickers.
          </h1>
          <p className="text-zinc-500">
            Thirty years of financials, the ratios that matter, and a disciplined
            intrinsic-value estimate — for every company we cover.
          </p>
        </div>

        <div className="max-w-2xl">
          <SearchBox autoFocus />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Covered companies</h2>
          <span className="text-sm text-zinc-500">{covered.length} in the universe</span>
        </div>

        {covered.length === 0 ? (
          // Empty is its own state, with the action that resolves it — not a
          // blank table that reads as a broken page.
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              No companies ingested yet. Run the pipeline to populate the database:
            </p>
            <code className="mt-3 inline-block rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs dark:bg-zinc-900">
              npm run ingest -- --stage=all --provider=fixture
            </code>
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
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(c.fairValuePerShare)}
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
    </div>
    </Reveal>
  )
}
