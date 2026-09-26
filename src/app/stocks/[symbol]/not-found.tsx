import Link from 'next/link'

export default function StockNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not in our universe</h1>
      <p className="text-sm text-zinc-500">
        We only cover companies that have been ingested. A missing ticker usually means the
        universe stage has not run for its exchange yet — not that the company does not exist.
      </p>
      <code className="inline-block rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs dark:bg-zinc-900">
        npm run ingest -- --stage=all --symbols=TICKER
      </code>
      <div>
        <Link href="/" className="text-sm underline underline-offset-4">
          Back to search
        </Link>
      </div>
    </div>
  )
}
