import { fail, ok } from '@/lib/mobile-api/responses'
import { createServiceClient } from '@/lib/supabase/server'
import { serializeAirline, serializeAirport, serializeFlight } from '@/lib/mobile-api/serializers'
import type { Airline, Airport, FlightWithDetails } from '@/lib/types'

export async function GET() {
  const serviceClient = await createServiceClient()
  const [airportsResult, airlinesResult, flightsResult] = await Promise.all([
    serviceClient
      .from('airports')
      .select('id, code, name, city, country, created_at')
      .order('city', { ascending: true }),
    serviceClient
      .from('airlines')
      .select('id, code, name, logo_url, created_at')
      .order('name', { ascending: true }),
    serviceClient
      .from('flights')
      .select(`
        *,
        airline:airlines(*),
        departure_airport:airports!flights_departure_airport_id_fkey(*),
        arrival_airport:airports!flights_arrival_airport_id_fkey(*)
      `)
      .gt('departure_time', new Date().toISOString())
      .gt('available_seats', 0)
      .order('departure_time', { ascending: true })
      .limit(6),
  ])

  if (airportsResult.error || airlinesResult.error || flightsResult.error) {
    return fail('Gagal memuat data home', 500)
  }

  const popularFlights = ((flightsResult.data ?? []) as FlightWithDetails[])
    .filter((flight) => flight.airline && flight.departure_airport && flight.arrival_airport)
    .map(serializeFlight)

  return ok({
    airports: ((airportsResult.data ?? []) as Airport[]).map(serializeAirport),
    airlines: ((airlinesResult.data ?? []) as Airline[]).map(serializeAirline),
    popularRoutes: [],
    popularFlights,
  })
}
