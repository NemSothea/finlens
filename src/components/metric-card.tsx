import { MISSING } from '@/lib/format'

/**
 * One labelled number. Server component — no interactivity, so no client bundle.
 *
 * `hint` carries the definition of the metric. A research tool that shows
 * "ROE 34.1%" without saying what it divides by is asking the user to trust a
 * number they cannot check.
 */
export function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: string
}) {
  const missing = value === MISSING

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={`mt-1 font-mono text-xl font-semibold ${
          missing ? 'text-zinc-400' : (tone ?? 'text-zinc-900 dark:text-zinc-100')
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  )
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  )
}
