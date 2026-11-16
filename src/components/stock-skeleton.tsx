import {
  CardSkeleton,
  ChartTileSkeleton,
  HeadingSkeleton,
  LoadingShell,
  Skeleton,
  TableSkeleton,
} from './skeleton'

/** Mirrors the stock page block for block so nothing reflows when data lands. */
export function StockPageSkeleton() {
  return (
    <LoadingShell label="Loading company">
      <div className="space-y-12">
        {/* Header */}
        <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-4 dark:border-zinc-800">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>

        {/* Stat cards */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <CardSkeleton key={i} rows={4} />
          ))}
        </section>

        {/* Fundamentals grid */}
        <section>
          <HeadingSkeleton />
          <div className="mb-4 flex justify-between">
            <Skeleton className="h-7 w-64 rounded-full" />
            <Skeleton className="h-7 w-48 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ChartTileSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Intrinsic value */}
        <section>
          <HeadingSkeleton />
          <div className="mb-6 flex flex-wrap gap-6">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-56 rounded-full" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </section>

        <section>
          <HeadingSkeleton />
          <TableSkeleton rows={5} cols={6} />
        </section>
      </div>
    </LoadingShell>
  )
}
