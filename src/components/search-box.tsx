'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrencyCompact, formatPrice } from '@/lib/format'

interface Result {
  symbol: string
  name: string
  exchange: string | null
  sector: string | null
  price: number | null
  marketCap: number | null
}

/**
 * Typeahead over /api/stocks/search.
 *
 * Debounced and abortable: without the abort, a fast typist's earlier request
 * can resolve after a later one and overwrite fresh results with stale ones —
 * the classic out-of-order race that makes a search box feel broken.
 */
export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const trimmed = query.trim()

  // Derived, not stored. Clearing the box is a render-time fact — pushing it
  // through setState inside the effect would cost an extra render pass and
  // leave a frame where stale results are still on screen.
  const visible = trimmed.length === 0 ? [] : results
  const busy = trimmed.length > 0 && loading

  useEffect(() => {
    const q = query.trim()
    if (q.length === 0) return

    const controller = new AbortController()

    const timer = setTimeout(async () => {
      // Loading starts when the request actually fires, not on every keystroke —
      // otherwise the spinner flickers on and off through the debounce window.
      setLoading(true)
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`search failed: ${res.status}`)
        const data = (await res.json()) as { results: Result[] }
        setResults(data.results)
        setHighlight(0)
        setOpen(true)
      } catch (error) {
        // An aborted request is the expected path on every keystroke, not a failure.
        if ((error as Error).name !== 'AbortError') setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 180)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickAway)
    return () => document.removeEventListener('mousedown', onClickAway)
  }, [])

  function go(symbol: string) {
    setOpen(false)
    setQuery('')
    router.push(`/stocks/${symbol}`)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || visible.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((h) => (h + 1) % visible.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((h) => (h - 1 + visible.length) % visible.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(visible[highlight].symbol)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => visible.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search a ticker or company — AAPL, Costco…"
        aria-label="Search stocks"
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />

      {busy && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">…</span>
      )}

      {open && visible.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {visible.map((r, i) => (
            <li key={r.symbol}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => go(r.symbol)}
                className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition ${
                  i === highlight ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                }`}
              >
                <span className="min-w-0">
                  <span className="font-mono text-sm font-semibold">{r.symbol}</span>
                  <span className="ml-2 truncate text-sm text-zinc-500">{r.name}</span>
                </span>
                <span className="shrink-0 text-right text-xs text-zinc-500">
                  <span className="block">{formatPrice(r.price)}</span>
                  <span className="block">{formatCurrencyCompact(r.marketCap)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !busy && trimmed.length > 0 && visible.length === 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          No match for “{trimmed}”. Only companies in our ingested universe are searchable.
        </div>
      )}
    </div>
  )
}
