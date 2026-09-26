import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getWatchlist } from '@/lib/queries/user'
import { removeFromWatchlist } from '@/app/actions/watchlist'
import { getEntitlementForUser } from '@/lib/queries/billing'
import { SectionHeading } from '@/components/metric-card'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import {
  formatCurrencyCompact,
  formatPrice,
  formatSignedPercent,
  toneForSigned,
  MISSING,
} from '@/lib/format'

export const metadata = { title: 'Watchlist | finlens' }

export default async function WatchlistPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/signin')

  const [items, entitlement] = await Promise.all([
    getWatchlist(session.user.id),
    getEntitlementForUser(session.user.id),
  ])

  const limit = entitlement.limits.watchlistSize
  const atLimit = items.length >= limit

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Watchlist"
        subtitle="The names you are tracking, with the gap between price and fair value."
      />

      {atLimit && (
        <UpgradePrompt
          feature={`Your plan holds ${limit} companies — Pro is unlimited`}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Nothing on your watchlist yet. Open any company and add it.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm underline underline-offset-4"
          >
            Find a company
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Fair value</th>
                <th className="px-4 py-3 text-right font-medium">Margin of safety</th>
                <th className="px-4 py-3 text-right font-medium">Target</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/stocks/${item.symbol}`}
                      className="font-mono font-semibold underline-offset-4 hover:underline"
                    >
                      {item.symbol}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-500">{item.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatPrice(item.fairValuePerShare)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${toneForSigned(item.marginOfSafetyPct)}`}
                  >
                    {formatSignedPercent(item.marginOfSafetyPct)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-500">
                    {item.targetPrice == null ? MISSING : formatPrice(item.targetPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* A plain form post — removal works without JavaScript. */}
                    <form
                      action={async () => {
                        'use server'
                        await removeFromWatchlist(item.symbol)
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs text-zinc-400 underline underline-offset-4 transition hover:text-rose-500"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-zinc-400">
          {items.length} {items.length === 1 ? 'company' : 'companies'} · market caps totalling{' '}
          {formatCurrencyCompact(
            items.reduce((sum, i) => sum + (i.marketCap ?? 0), 0),
          )}
        </p>
      )}
    </div>
  )
}
