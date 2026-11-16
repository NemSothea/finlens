import { HeadingSkeleton, LoadingShell, TableSkeleton } from '@/components/skeleton'

export default function Loading() {
  return (
    <LoadingShell label="Loading portfolio">
      <div className="space-y-6">
        <HeadingSkeleton />
        <TableSkeleton rows={5} cols={6} />
      </div>
    </LoadingShell>
  )
}
