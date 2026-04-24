import { Skeleton } from '@/components/ui/skeleton'

export default function FlightsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b bg-background" />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
