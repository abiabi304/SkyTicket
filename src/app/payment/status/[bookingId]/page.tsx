import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Status Pembayaran',
}

interface PaymentStatusPageProps {
  params: { bookingId: string }
}

export default async function PaymentStatusPage({ params }: PaymentStatusPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: booking }, { data: profile }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, payment:payments(*)')
      .eq('id', params.bookingId)
      .eq('user_id', user.id)
      .single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!booking) redirect('/my-bookings')

  const status = booking.status as string

  const statusConfig = {
    paid: {
      icon: CheckCircle2,
      title: 'Pembayaran Berhasil!',
      description: 'Tiket Anda telah dikonfirmasi. Anda dapat melihat e-ticket di halaman pesanan.',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    pending: {
      icon: Clock,
      title: 'Menunggu Pembayaran',
      description: 'Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran sesuai instruksi.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    cancelled: {
      icon: XCircle,
      title: 'Pembayaran Gagal',
      description: 'Pembayaran Anda tidak berhasil. Silakan coba lagi atau hubungi customer service.',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    expired: {
      icon: XCircle,
      title: 'Booking Kedaluwarsa',
      description: 'Waktu pembayaran telah habis. Silakan buat booking baru.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending
  const Icon = config.icon

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex flex-1 items-center justify-center px-4 pb-20 md:pb-0">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className={`mx-auto mb-4 flex size-20 items-center justify-center rounded-full ${config.bgColor}`}>
              <Icon className={`size-10 ${config.color}`} />
            </div>
            <h1 className="mb-2 text-xl font-bold">{config.title}</h1>
            <p className="mb-2 font-mono text-sm text-muted-foreground">
              Kode Booking: {booking.booking_code}
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              {config.description}
            </p>
            <div className="flex flex-col gap-2">
              {status === 'paid' && (
                <Button asChild>
                  <Link href={`/my-bookings/${params.bookingId}`}>
                    Lihat E-Ticket
                  </Link>
                </Button>
              )}
              {status === 'pending' && (
                <Button asChild>
                  <Link href={`/payment/${params.bookingId}`}>
                    Lanjutkan Pembayaran
                  </Link>
                </Button>
              )}
              {(status === 'cancelled' || status === 'expired') && (
                <Button asChild>
                  <Link href="/">Cari Penerbangan Baru</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/my-bookings">Pesanan Saya</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  )
}
