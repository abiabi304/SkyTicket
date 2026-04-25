export const dynamic = 'force-dynamic'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Footer } from '@/components/layout/footer'
import { FlightResults } from '@/components/flights/flight-results'
import type { FlightWithDetails, Airline, Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cari Penerbangan',
}

interface FlightsPageProps {
  searchParams: {
    from?: string
    to?: string
    date?: string
    month?: string
    pax?: string
    class?: string
  }
}

export default async function FlightsPage({ searchParams }: FlightsPageProps) {
  const supabase = await createClient()
  const { from, to, date, month, pax, class: seatClass } = searchParams
  const passengerCount = Math.min(5, Math.max(1, Number(pax) || 1))

  const { data: { user } } = await supabase.auth.getUser()
  let profile: Profile | null = null
  if (user) {
    const serviceClient = await createServiceClient()
    const { data } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Look up airport IDs by code
  let depAirportId: string | null = null
  let arrAirportId: string | null = null

  if (from) {
    const { data: depAirport } = await supabase
      .from('airports').select('id').eq('code', from.toUpperCase()).single()
    depAirportId = depAirport?.id ?? null
  }
  if (to) {
    const { data: arrAirport } = await supabase
      .from('airports').select('id').eq('code', to.toUpperCase()).single()
    arrAirportId = arrAirport?.id ?? null
  }

  // Build flight query — always exclude past flights
  const now = new Date().toISOString()

  let query = supabase
    .from('flights')
    .select(`
      *,
      airline:airlines(*),
      departure_airport:airports!flights_departure_airport_id_fkey(*),
      arrival_airport:airports!flights_arrival_airport_id_fkey(*)
    `)
    .gte('available_seats', passengerCount)
    .gt('departure_time', now)

  if (depAirportId) {
    query = query.eq('departure_airport_id', depAirportId)
  }
  if (arrAirportId) {
    query = query.eq('arrival_airport_id', arrAirportId)
  }
  if (seatClass && (seatClass === 'economy' || seatClass === 'business')) {
    query = query.eq('seat_class', seatClass)
  }

  // Date filter: specific date OR entire month
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const startOfDay = `${date}T00:00:00+07:00`
    const endOfDay = `${date}T23:59:59.999+07:00`
    query = query.gte('departure_time', startOfDay).lte('departure_time', endOfDay)
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, mon] = month.split('-').map(Number)
    const startOfMonth = `${month}-01T00:00:00+07:00`
    // Last day of month
    const lastDay = new Date(year, mon, 0).getDate()
    const endOfMonth = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999+07:00`
    query = query.gte('departure_time', startOfMonth).lte('departure_time', endOfMonth)
  }

  query = query.order('departure_time', { ascending: true })

  const { data: flights } = await query

  const validFlights = (flights ?? []).filter(
    (f) => f.departure_airport && f.arrival_airport && f.airline
  ) as FlightWithDetails[]

  // Only include airlines that have matching flights
  const matchingAirlines: Airline[] = validFlights
    .map((f) => f.airline)
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <FlightResults
          flights={validFlights}
          airlines={matchingAirlines}
          passengers={passengerCount}
          from={from ?? ''}
          to={to ?? ''}
          date={date ?? ''}
          month={month ?? ''}
          seatClass={seatClass ?? 'economy'}
        />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
