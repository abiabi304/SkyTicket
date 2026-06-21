import { requireMobileUser } from '@/lib/mobile-api/auth'
import { fail, ok } from '@/lib/mobile-api/responses'
import { serializeBookingDetail } from '@/lib/mobile-api/serializers'
import { isValidUUID } from '@/lib/validators'
import type { BookingWithDetails } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const auth = await requireMobileUser(request)
  if ('error' in auth) return auth.error

  const { bookingId } = await params
  if (!isValidUUID(bookingId)) {
    return fail('Booking tidak valid', 400)
  }

  const { data, error } = await auth.serviceClient
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
    .eq('id', bookingId)
    .eq('user_id', auth.user.id)
    .single()

  if (error || !data) {
    return fail('Booking tidak ditemukan', 404)
  }

  return ok({ booking: serializeBookingDetail(data as BookingWithDetails) })
}
