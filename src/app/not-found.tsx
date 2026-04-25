import Link from 'next/link'
import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10">
          <div className="rounded-full bg-primary/10 p-4">
            <Plane className="size-10 text-primary" />
          </div>

          <p className="text-7xl font-bold text-primary">404</p>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-sm text-muted-foreground">
              Halaman yang Anda cari tidak ada atau telah dipindahkan.
            </p>
          </div>

          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
