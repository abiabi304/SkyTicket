import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-gray-800 p-8 shadow-xl">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-32 bg-gray-700" />
          <Skeleton className="mx-auto h-4 w-48 bg-gray-700" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg bg-gray-700" />
        <Skeleton className="h-10 w-full rounded-lg bg-gray-700" />
      </div>
    </div>
  )
}
