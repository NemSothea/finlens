import { MISSING } from '@/lib/format'

export interface StatRow {
  label: string
  value: string
  /** Tailwind text class for signed values; ignored when the value is missing. */
  tone?: string
  /** Definition of the metric, shown on hover — every number should be checkable. */
  hint?: string
}

/**
 * A titled group of labelled numbers. Server component — no interactivity.
 * The footnote states the period the numbers describe (TTM vs fiscal year),
 * because a margin without its period is half a fact.
 */
export function StatCard({
  title,
  rows,
  footnote,
}: {
  title: string
  rows: StatRow[]
  footnote?: string
}) {
  return (
    <section className="flex flex-col rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</h3>
      <dl className="mt-3 flex-1 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2 text-sm" title={r.hint}>
            <dt className="shrink-0 text-zinc-600 dark:text-zinc-400">{r.label}</dt>
            <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-zinc-200 dark:border-zinc-800" />
            <dd
              className={`shrink-0 font-mono font-medium ${
                r.value === MISSING ? 'text-zinc-400' : (r.tone ?? 'text-zinc-900 dark:text-zinc-100')
              }`}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      {footnote && <p className="mt-3 text-xs text-zinc-400">{footnote}</p>}
    </section>
  )
}
