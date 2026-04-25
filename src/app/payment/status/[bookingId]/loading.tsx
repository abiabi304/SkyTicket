import { Skeleton } from '@/components/ui/skeleton'

export default function PaymentStatusLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 border-b bg-background" />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  )
}
