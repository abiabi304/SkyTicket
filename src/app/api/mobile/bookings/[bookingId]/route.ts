import { requireMobileUser } from '@/lib/mobile-api/auth'
import { fail, ok } from '@/lib/mobile-api/responses'
import { serializeBookingDetail } from '@/lib/mobile-api/serializers'
import { reconcileLatestBookingPayment } from '@/lib/midtrans/reconcile'
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

  const fetchBooking = () => auth.serviceClient
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
    `)
    .eq('id', bookingId)
    .eq('user_id', auth.user.id)
    .single()

  const { data: initialData, error } = await fetchBooking()

  if (error || !initialData) {
    if (error) console.error('mobile booking detail query error', error)
    return fail('Booking tidak ditemukan', 404)
  }

  let booking = initialData as BookingWithDetails

  if (booking.status === 'pending' || booking.status === 'rescheduling') {
    await reconcileLatestBookingPayment(auth.serviceClient, bookingId)
    const { data: refreshedData } = await fetchBooking()
    if (refreshedData) booking = refreshedData as BookingWithDetails
  }
  if (
    !booking.flight ||
    !booking.flight.airline ||
    !booking.flight.departure_airport ||
    !booking.flight.arrival_airport
  ) {
    return fail('Detail booking tidak lengkap', 500)
  }

  try {
    return ok({ booking: serializeBookingDetail(booking) })
  } catch (error) {
    console.error('mobile booking detail serialize error', error)
    return fail('Gagal memuat detail booking', 500)
  }
}
