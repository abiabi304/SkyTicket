import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { BookingFlow } from '@/components/booking/booking-flow'
import type { FlightWithDetails, Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pesan Penerbangan',
}

interface BookingPageProps {
  params: { flightId: string }
  searchParams: { pax?: string }
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/booking/${params.flightId}?pax=${searchParams.pax ?? '1'}`)
  }

  const [{ data: flight }, { data: profile }] = await Promise.all([
    supabase
      .from('flights')
      .select(`
        *,
        airline:airlines(*),
        departure_airport:airports!flights_departure_airport_id_fkey(*),
        arrival_airport:airports!flights_arrival_airport_id_fkey(*)
      `)
      .eq('id', params.flightId)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  if (!flight) {
    redirect('/flights')
  }

  const typedFlight = flight as FlightWithDetails
  const passengers = Math.min(5, Math.max(1, Number(searchParams.pax) || 1))

  // Check available seats
  if (typedFlight.available_seats < passengers) {
    redirect(`/flights?error=seats&from=${typedFlight.departure_airport?.code ?? ''}&to=${typedFlight.arrival_airport?.code ?? ''}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <BookingFlow
          flight={flight as FlightWithDetails}
          profile={profile as Profile}
          passengerCount={passengers}
        />
      </main>
      <MobileNav />
    </div>
  )
}
