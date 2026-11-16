'use client'

import { useState, useTransition } from 'react'
import { toggleWatchlist } from '@/app/actions/watchlist'

/**
 * Optimistic watchlist toggle.
 *
 * Flips immediately and rolls back if the server rejects. Waiting for a round
 * trip to redraw a star makes the whole app feel broken, but a toggle that
 * silently stays flipped after a failure is worse — hence the rollback and the
 * inline error.
 */
export function WatchButton({
  symbol,
  initiallyWatched,
  signedIn,
}: {
  symbol: string
  initiallyWatched: boolean
  signedIn: boolean
}) {
  const [watched, setWatched] = useState(initiallyWatched)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!signedIn) {
    return (
      <a
        href="/signin"
        className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Sign in to watch
      </a>
    )
  }

  function onClick() {
    const next = !watched
    setWatched(next)
    setError(null)

    startTransition(async () => {
      const result = await toggleWatchlist(symbol)
      if (!result.ok) {
        setWatched(!next)
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={watched}
        className={`motion-press rounded-xl border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
          watched
            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
            : 'border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
        }`}
      >
        {watched ? 'Watching' : 'Add to watchlist'}
      </button>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </div>
  )
}
