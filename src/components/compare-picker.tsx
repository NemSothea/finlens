'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Result {
  symbol: string
  name: string
}

/**
 * Chips for the companies being compared, plus an add-stock typeahead. The URL
 * (`?symbols=A,B`) stays the single source of truth so a comparison is a link
 * you can share, and the server re-renders with the plan limit applied.
 */
export function ComparePicker({
  symbols,
  limit,
}: {
  symbols: string[]
  limit: number
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const go = (next: string[]) => {
    const unique = [...new Set(next.map((s) => s.toUpperCase()))]
    // The picker survives the navigation; close and clear it so a full plan
    // does not leave an open search box behind.
    setAdding(false)
    setQuery('')
    setResults([])
    router.push(unique.length ? `/compare?symbols=${unique.join(',')}` : '/compare')
  }

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  useEffect(() => {
    const q = query.trim()
    if (q.length === 0) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}&limit=6`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { results: Result[] }
        setResults(data.results.filter((r) => !symbols.includes(r.symbol)))
      } catch {
        // Aborted or offline — the previous results simply stay.
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, symbols])

  const atLimit = symbols.length >= limit
  const visible = query.trim() ? results : []

  return (
    <div className="flex flex-wrap items-center gap-2">
      {symbols.map((s, i) => (
        <span
          key={s}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-3 pr-1 text-sm dark:border-zinc-800"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--series-${(i % 4) + 1})` }} />
          <span className="font-mono">{s}</span>
          <button
            type="button"
            onClick={() => go(symbols.filter((x) => x !== s))}
            aria-label={`Remove ${s}`}
            className="rounded-full px-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            ×
          </button>
        </span>
      ))}

      {adding ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setAdding(false)
                setQuery('')
              }
              if (e.key === 'Enter' && visible[0]) go([...symbols, visible[0].symbol])
            }}
            onBlur={() => setTimeout(() => setAdding(false), 150)}
            placeholder="Ticker or company"
            aria-label="Add a company to compare"
            className="w-48 rounded-full border border-zinc-300 bg-transparent px-3 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
          {visible.length > 0 && (
            <ul className="absolute z-10 mt-1 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              {visible.map((r) => (
                <li key={r.symbol}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go([...symbols, r.symbol])}
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <span className="font-mono font-semibold">{r.symbol}</span>
                    <span className="truncate text-zinc-500">{r.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={atLimit}
          title={atLimit ? `Your plan compares up to ${limit} companies` : undefined}
          className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          + Add stock
        </button>
      )}
    </div>
  )
}
