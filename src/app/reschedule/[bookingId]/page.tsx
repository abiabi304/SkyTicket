export const dynamic = 'force-dynamic'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ReschedulePage } from '@/components/reschedule/reschedule-page'
import type { BookingWithDetails, FlightWithDetails, Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reschedule Penerbangan',
}

interface ReschedulePageProps {
  params: { bookingId: string }
}

export default async function Reschedule({ params }: ReschedulePageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/reschedule/${params.bookingId}`)

  const serviceClient = await createServiceClient()

  const [{ data: booking }, { data: profile }] = await Promise.all([
    serviceClient
      .from('bookings')
      .select(`
        *,
        flight:flights!bookings_flight_id_fkey(
          *,
          airline:airlines(*),
          departure_airport:airports!flights_departure_airport_id_fkey(*),
          arrival_airport:airports!flights_arrival_airport_id_fkey(*)
        ),
        passengers(*)
      `)
      .eq('id', params.bookingId)
      .eq('user_id', user.id)
      .single(),
    serviceClient.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!booking) redirect('/my-bookings')

  const typedBooking = booking as unknown as BookingWithDetails

  // Only paid bookings can be rescheduled
  if (typedBooking.status !== 'paid') {
    redirect(`/my-bookings/${params.bookingId}`)
  }

  // Check reschedule limit
  if (typedBooking.reschedule_count >= 2) {
    redirect(`/my-bookings/${params.bookingId}`)
  }

  // Check 24h before departure
  const departureTime = new Date(typedBooking.flight.departure_time)
  const now = new Date()
  const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursUntilDeparture < 24) {
    redirect(`/my-bookings/${params.bookingId}`)
  }

  // Fetch available flights on the same route & seat class (excluding current flight)
  const { data: availableFlights } = await serviceClient
    .from('flights')
    .select(`
      *,
      airline:airlines(*),
      departure_airport:airports!flights_departure_airport_id_fkey(*),
      arrival_airport:airports!flights_arrival_airport_id_fkey(*)
    `)
    .eq('departure_airport_id', typedBooking.flight.departure_airport.id)
    .eq('arrival_airport_id', typedBooking.flight.arrival_airport.id)
    .eq('seat_class', typedBooking.flight.seat_class)
    .gt('available_seats', typedBooking.passenger_count - 1)
    .gt('departure_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
    .neq('id', typedBooking.flight.id)
    .order('departure_time', { ascending: true })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <ReschedulePage
          booking={typedBooking}
          availableFlights={(availableFlights as unknown as FlightWithDetails[]) ?? []}
        />
      </main>
      <MobileNav />
    </div>
  )
}
