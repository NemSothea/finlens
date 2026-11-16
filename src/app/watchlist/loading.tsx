import { HeadingSkeleton, LoadingShell, TableSkeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <LoadingShell label="Loading watchlist">
      <div className="space-y-6">
        <HeadingSkeleton />
        <TableSkeleton rows={5} cols={5} />
      </div>
    </LoadingShell>
  )
}
