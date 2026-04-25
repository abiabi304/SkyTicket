import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { BookingCard } from '@/components/my-bookings/booking-card'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pesanan Saya',
}

export default async function MyBookingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/my-bookings')

  const [{ data: bookings, error: bookingsError }, { data: profile }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        *,
        flight:flights(
          *,
          airline:airlines(*),
          departure_airport:airports!flights_departure_airport_id_fkey(*),
          arrival_airport:airports!flights_arrival_airport_id_fkey(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (bookingsError) {
    console.error('Bookings fetch error:', bookingsError, 'User ID:', user.id)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <PageHeader title="Pesanan Saya" subtitle="Riwayat pemesanan tiket Anda" />

          <div className="mt-6 space-y-3">
            {!bookings || bookings.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Belum ada pesanan"
                description="Anda belum memiliki pesanan tiket. Mulai cari penerbangan sekarang!"
                actionLabel="Cari Penerbangan"
                actionHref="/"
              />
            ) : (
              bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
