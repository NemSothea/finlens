'use client'

import { useState, useTransition } from 'react'
import { addTransaction } from '@/app/actions/portfolio'

/**
 * Trade entry.
 *
 * Fields shift by kind because the same five inputs mean different things: a
 * split's "quantity" is a ratio, and a dividend's "price" is per-share cash.
 * Labelling them generically is how users enter a 2-for-1 split as 2 shares.
 */
export function TransactionForm({ portfolioId }: { portfolioId: number }) {
  const [kind, setKind] = useState<'buy' | 'sell' | 'dividend' | 'split'>('buy')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const quantityLabel =
    kind === 'split' ? 'Ratio (2 = 2-for-1)' : kind === 'dividend' ? 'Shares held' : 'Shares'
  const priceLabel =
    kind === 'dividend' ? 'Dividend per share' : kind === 'split' ? 'Not used' : 'Price per share'

  function onSubmit(formData: FormData) {
    setError(null)
    setDone(false)

    startTransition(async () => {
      const result = await addTransaction({
        portfolioId,
        symbol: String(formData.get('symbol') ?? ''),
        kind,
        quantity: Number(formData.get('quantity')),
        pricePerShare: Number(formData.get('pricePerShare') ?? 0),
        fees: Number(formData.get('fees') ?? 0),
        tradedAt: String(formData.get('tradedAt') ?? ''),
        note: String(formData.get('note') ?? '') || undefined,
      })

      if (result.ok) setDone(true)
      else setError(result.error)
    })
  }

  return (
    <form
      action={onSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
    >
      <div className="flex flex-wrap gap-2">
        {(['buy', 'sell', 'dividend', 'split'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition ${
              kind === k
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Ticker" name="symbol" placeholder="AAPL" required />
        <Field label={quantityLabel} name="quantity" type="number" step="any" required />
        <Field
          label={priceLabel}
          name="pricePerShare"
          type="number"
          step="any"
          disabled={kind === 'split'}
          defaultValue={kind === 'split' ? '0' : undefined}
        />
        <Field label="Fees" name="fees" type="number" step="any" defaultValue="0" />
        <Field
          label="Date"
          name="tradedAt"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
        <Field label="Note" name="note" placeholder="optional" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      {done && <p className="text-sm text-emerald-600 dark:text-emerald-400">Trade recorded.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? 'Saving…' : `Record ${kind}`}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  ...rest
}: {
  label: string
  name: string
  type?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        {...rest}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
    </div>
  )
}
