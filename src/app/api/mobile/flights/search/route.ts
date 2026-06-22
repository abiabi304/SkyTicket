import type { SupabaseClient } from '@supabase/supabase-js'
import { fail, ok } from '@/lib/mobile-api/responses'
import { createServiceClient } from '@/lib/supabase/server'
import { serializeFlight } from '@/lib/mobile-api/serializers'
import { parseMaxPrice, parsePassengerCount, parsePositiveInt, parseSeatClass, parseSortOption, parseTimeFilters } from '@/lib/mobile-api/validators'
import type { FlightWithDetails, TimeFilter } from '@/lib/types'

function isSameAirportValue(value: string) {
  return value.trim().toLowerCase()
}

function timeFilterMatches(filters: TimeFilter[], departureTime: string) {
  if (filters.length === 0) return true
  const hour = new Date(departureTime).getHours()
  return filters.some((filter) => {
    if (filter === 'pagi') return hour >= 5 && hour < 12
    if (filter === 'siang') return hour >= 12 && hour < 18
    return hour >= 18 || hour < 5
  })
}

function dateRangeFor(searchParams: URLSearchParams) {
  const date = searchParams.get('date')
  const month = searchParams.get('month')
  const searchByMonth = searchParams.get('searchByMonth') === 'true'

  if (!searchByMonth && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      start: `${date}T00:00:00+09:00`,
      end: `${date}T23:59:59.999+07:00`,
    }
  }

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNumber] = month.split('-').map(Number)
    const lastDay = new Date(year ?? 2026, monthNumber ?? 1, 0).getDate()
    return {
      start: `${month}-01T00:00:00+09:00`,
      end: `${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999+07:00`,
    }
  }

  return null
}

async function airportIdFor(serviceClient: SupabaseClient, value: string) {
  const normalized = isSameAirportValue(value)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)
  const query = serviceClient.from('airports').select('id')
  const { data } = isUuid
    ? await query.or(`id.eq.${normalized},code.eq.${value.toUpperCase()}`)
      .maybeSingle()
    : await query.eq('code', value.toUpperCase()).maybeSingle()

  return data?.id ?? null
}

export async function GET(request: Request) {
  const serviceClient = await createServiceClient()

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return fail('Bandara asal dan tujuan wajib diisi', 400)
    }

    if (isSameAirportValue(from) === isSameAirportValue(to)) {
      return fail('Bandara asal dan tujuan tidak boleh sama', 400)
    }

    const passengers = parsePassengerCount(searchParams.get('passengers'))
    const seatClass = parseSeatClass(searchParams.get('seatClass') ?? 'economy')
    const sort = parseSortOption(searchParams.get('sort'))
    const timeFilters = parseTimeFilters(searchParams.get('timeFilters'))
    const maxPrice = parseMaxPrice(searchParams.get('maxPrice'))
    const page = parsePositiveInt(searchParams.get('page'), 1, 1000)
    const limit = parsePositiveInt(searchParams.get('limit'), 20, 50)
    const airlineIds = (searchParams.get('airlineIds') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const [departureAirportId, arrivalAirportId] = await Promise.all([
      airportIdFor(serviceClient, from),
      airportIdFor(serviceClient, to),
    ])

    if (!departureAirportId || !arrivalAirportId) {
      return fail('Bandara asal atau tujuan tidak ditemukan', 404)
    }

    const now = new Date().toISOString()
    let query = serviceClient
      .from('flights')
      .select(`
        *,
        airline:airlines(*),
        departure_airport:airports!flights_departure_airport_id_fkey(*),
        arrival_airport:airports!flights_arrival_airport_id_fkey(*)
      `, { count: 'exact' })
      .eq('departure_airport_id', departureAirportId)
      .eq('arrival_airport_id', arrivalAirportId)
      .eq('seat_class', seatClass)
      .gte('available_seats', passengers)
      .gt('departure_time', now)

    const range = dateRangeFor(searchParams)
    if (range) {
      query = query.gte('departure_time', range.start).lte('departure_time', range.end)
    }

    if (airlineIds.length > 0) {
      query = query.in('airline_id', airlineIds)
    }

    if (maxPrice != null) {
      query = query.lte('price', maxPrice)
    }

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    if (sort === 'price_desc') query = query.order('price', { ascending: false })
    if (sort === 'departure_asc') query = query.order('departure_time', { ascending: true })
    if (sort === 'duration_asc') query = query.order('duration_minutes', { ascending: true })

    const fromIndex = (page - 1) * limit
    const toIndex = fromIndex + limit - 1
    const { data, error, count } = await query.range(fromIndex, toIndex)

    if (error) {
      return fail('Gagal memuat penerbangan', 500)
    }

    const filteredFlights = ((data ?? []) as FlightWithDetails[]).filter((flight) =>
      flight.airline &&
      flight.departure_airport &&
      flight.arrival_airport &&
      timeFilterMatches(timeFilters, flight.departure_time)
    )

    return ok({
      items: filteredFlights.map(serializeFlight),
      meta: {
        page,
        limit,
        total: count ?? filteredFlights.length,
        hasMore: fromIndex + filteredFlights.length < (count ?? filteredFlights.length),
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return fail(error.message, 400)
    }
    return fail('Gagal memuat penerbangan', 500)
  }
}
