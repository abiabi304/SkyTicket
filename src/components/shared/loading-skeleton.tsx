import { Skeleton } from '@/components/ui/skeleton'

export function FlightCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="space-y-1 text-right">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}

export function BookingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-40 mb-2" />
      <Skeleton className="h-4 w-56 mb-3" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <FlightCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
