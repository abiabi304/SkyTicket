import { requireMobileUser } from '@/lib/mobile-api/auth'
import { fail, ok } from '@/lib/mobile-api/responses'
import { serializeBookingSummary } from '@/lib/mobile-api/serializers'
import { parsePositiveInt } from '@/lib/mobile-api/validators'
import type { BookingWithDetails } from '@/lib/types'

export async function GET(request: Request) {
  const auth = await requireMobileUser(request)
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const page = parsePositiveInt(searchParams.get('page'), 1, 1000)
  const limit = parsePositiveInt(searchParams.get('limit'), 20, 50)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await auth.serviceClient
    .from('bookings')
    .select(`
      *,
      flight:flights!bookings_flight_id_fkey(
        *,
        airline:airlines(*),
        departure_airport:airports!flights_departure_airport_id_fkey(*),
        arrival_airport:airports!flights_arrival_airport_id_fkey(*)
      ),
      passengers:passengers!passengers_booking_id_fkey(*),
      payment:payments!payments_booking_id_fkey(*)
    `, { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('mobile bookings query error', error)
    return fail('Gagal memuat pesanan', 500)
  }

  const bookings = ((data ?? []) as BookingWithDetails[]).filter((booking) =>
    booking.flight &&
    booking.flight.airline &&
    booking.flight.departure_airport &&
    booking.flight.arrival_airport
  )

  try {
    return ok({
      items: bookings.map(serializeBookingSummary),
      meta: {
        page,
        limit,
        total: count ?? bookings.length,
        hasMore: from + bookings.length < (count ?? bookings.length),
      },
    })
  } catch (error) {
    console.error('mobile bookings serialize error', error)
    return fail('Gagal memuat pesanan', 500)
  }
}
