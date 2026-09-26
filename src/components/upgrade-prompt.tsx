import Link from 'next/link'

/**
 * The one place upgrade messaging is written.
 *
 * Says what the user gets, not what they are missing — and never blocks the
 * content around it. The free tier is meant to be genuinely useful; a wall in
 * front of every number trains people to leave rather than to pay.
 */
export function UpgradePrompt({
  feature,
  compact = false,
}: {
  feature: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <p className="text-xs text-zinc-500">
        {feature} —{' '}
        <Link href="/pricing" className="underline underline-offset-4">
          upgrade to Pro
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">Pro:</span> {feature}.
      </p>
      <Link
        href="/pricing"
        className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition dark:bg-zinc-100 dark:text-zinc-900"
      >
        See plans
      </Link>
    </div>
  )
}
