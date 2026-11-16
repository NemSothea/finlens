import { HeadingSkeleton, LoadingShell, Skeleton, TableSkeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <LoadingShell label="Loading comparison">
      <div className="space-y-8">
        <HeadingSkeleton />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-4 flex flex-wrap justify-between gap-3">
            <Skeleton className="h-7 w-80 max-w-full rounded-full" />
            <Skeleton className="h-7 w-48 rounded-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
        <TableSkeleton rows={10} cols={4} />
      </div>
    </LoadingShell>
  )
}
