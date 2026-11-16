import { ViewTransition, type CSSProperties, type ReactNode } from 'react'

/**
 * Loading placeholders and the reveal that replaces them.
 *
 * Skeletons mirror the real layout block for block (same grid, same card
 * heights) so nothing jumps when data lands — a skeleton that is the wrong
 * shape is worse than a spinner, because the page reflows twice.
 *
 * The handoff is a React view transition: the skeleton slides down and fades
 * out fast, then the content rises in (CSS classes `slide-down` / `slide-up`
 * in globals.css). Browsers without the View Transitions API just swap.
 */

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden className={`skeleton ${className}`} style={style} />
}

/** Wrap a route's loading UI. Announces the wait to screen readers once. */
export function LoadingShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ViewTransition exit="slide-down" default="none">
      <div role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">{label}</span>
        {children}
      </div>
    </ViewTransition>
  )
}

/** Wrap a page's real content so it rises in when it replaces the skeleton. */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="slide-up" default="none">
      {children}
    </ViewTransition>
  )
}

/* ------------------------------------------------------------------ *
 * Building blocks
 * ------------------------------------------------------------------ */

export function CardSkeleton({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 ${className}`}>
      <Skeleton className="h-3 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartTileSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-28" />
      <div className="mt-4 flex h-28 items-end gap-2">
        {[55, 70, 62, 80, 90].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex gap-6 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {Array.from({ length: cols }, (_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-6 border-b border-zinc-100 px-4 py-3.5 last:border-0 dark:border-zinc-900">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-3 flex-1 ${c === 0 ? 'max-w-16' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function HeadingSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="mb-4 space-y-2">
      <Skeleton className="h-5 w-48" />
      {subtitle && <Skeleton className="h-3 w-80 max-w-full" />}
    </div>
  )
}
