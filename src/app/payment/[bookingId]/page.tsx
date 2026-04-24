import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { PaymentPage } from '@/components/payment/payment-page'
import type { BookingWithDetails, Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pembayaran',
}

interface PaymentPageProps {
  params: { bookingId: string }
}

export default async function Payment({ params }: PaymentPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/payment/${params.bookingId}`)
  }

  const [{ data: booking }, { data: profile }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        *,
        flight:flights(
          *,
          airline:airlines(*),
          departure_airport:airports!flights_departure_airport_id_fkey(*),
          arrival_airport:airports!flights_arrival_airport_id_fkey(*)
        ),
        passengers(*),
        payment:payments(*)
      `)
      .eq('id', params.bookingId)
      .eq('user_id', user.id)
      .single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!booking) {
    redirect('/my-bookings')
  }

  // Normalize payment: Supabase returns array for one-to-many, take first
  const typedBooking = {
    ...booking,
    payment: Array.isArray(booking.payment) ? booking.payment[0] ?? null : booking.payment,
  } as unknown as BookingWithDetails

  if (typedBooking.status === 'paid') {
    redirect(`/my-bookings/${params.bookingId}`)
  }

  if (typedBooking.status === 'expired' || typedBooking.status === 'cancelled') {
    redirect(`/payment/status/${params.bookingId}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <PaymentPage booking={typedBooking} />
      </main>
      <MobileNav />
    </div>
  )
}
