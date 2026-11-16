import { LoadingShell, Skeleton, TableSkeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <LoadingShell label="Loading">
      <div className="space-y-12">
        <section className="max-w-2xl space-y-4">
          <Skeleton className="h-8 w-96 max-w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-6 h-11 w-full rounded-xl" />
        </section>
        <section>
          <div className="mb-4 flex justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>
          <TableSkeleton rows={7} cols={7} />
        </section>
      </div>
    </LoadingShell>
  )
}
