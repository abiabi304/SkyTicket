import { Skeleton } from '@/components/ui/skeleton'

export default function BookingLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b bg-background" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  )
}
