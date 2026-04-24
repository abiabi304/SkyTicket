import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Footer } from '@/components/layout/footer'
import { FlightResults } from '@/components/flights/flight-results'
import type { FlightWithDetails, Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cari Penerbangan',
}

interface FlightsPageProps {
  searchParams: {
    from?: string
    to?: string
    date?: string
    pax?: string
    class?: string
  }
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const supabase = await createClient()
  const { from, to, date, pax, class: seatClass } = searchParams

  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Look up airport IDs by code first (Supabase can't filter on joined table columns)
  let depAirportId: string | null = null
  let arrAirportId: string | null = null

  if (from) {
    const { data: depAirport } = await supabase
      .from('airports').select('id').eq('code', from).single()
    depAirportId = depAirport?.id ?? null
  }
  if (to) {
    const { data: arrAirport } = await supabase
      .from('airports').select('id').eq('code', to).single()
    arrAirportId = arrAirport?.id ?? null
  }

  let query = supabase
    .from('flights')
    .select(`
      *,
      airline:airlines(*),
      departure_airport:airports!flights_departure_airport_id_fkey(*),
      arrival_airport:airports!flights_arrival_airport_id_fkey(*)
    `)
    .gt('available_seats', 0)

  if (depAirportId) {
    query = query.eq('departure_airport_id', depAirportId)
  }
  if (arrAirportId) {
    query = query.eq('arrival_airport_id', arrAirportId)
  }
  if (seatClass) {
    query = query.eq('seat_class', seatClass)
  }
  if (date) {
    const startOfDay = `${date}T00:00:00+07:00`
    const endOfDay = `${date}T23:59:59+07:00`
    query = query.gte('departure_time', startOfDay).lte('departure_time', endOfDay)
  }

  query = query.order('departure_time', { ascending: true })

  const { data: flights } = await query

  const validFlights = (flights ?? []).filter(
    (f: FlightWithDetails) => f.departure_airport && f.arrival_airport && f.airline
  ) as FlightWithDetails[]

  const { data: airlines } = await supabase.from('airlines').select('*')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <FlightResults
          flights={validFlights}
          airlines={airlines ?? []}
          passengers={Number(pax) || 1}
          from={from ?? ''}
          to={to ?? ''}
          date={date ?? ''}
          seatClass={seatClass ?? 'economy'}
        />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
