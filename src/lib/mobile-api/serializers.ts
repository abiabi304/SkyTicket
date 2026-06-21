import type { Airline, Airport, BookingWithDetails, FlightSeat, FlightWithDetails, Payment, Profile } from '@/lib/types'

type MaybePayment = Payment | Payment[] | null

type BookingDetail = Omit<BookingWithDetails, 'payment'> & {
  payment: MaybePayment
}

export function serializeProfile(profile: Profile) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    role: profile.role,
  }
}

export function serializeAirport(airport: Airport) {
  return {
    id: airport.id,
    code: airport.code,
    name: airport.name,
    city: airport.city,
    country: airport.country ?? 'Indonesia',
  }
}

export function serializeAirline(airline: Airline) {
  return {
    id: airline.id,
    code: airline.code,
    name: airline.name,
    logoUrl: airline.logo_url,
  }
}

export function serializeFlight(flight: FlightWithDetails) {
  return {
    id: flight.id,
    airline: serializeAirline(flight.airline),
    flightNumber: flight.flight_number,
    departureAirport: serializeAirport(flight.departure_airport),
    arrivalAirport: serializeAirport(flight.arrival_airport),
    departureTime: flight.departure_time,
    arrivalTime: flight.arrival_time,
    durationMinutes: flight.duration_minutes,
    price: flight.price,
    seatClass: flight.seat_class,
    availableSeats: flight.available_seats,
  }
}

export function serializePayment(payment: Payment | null) {
  if (!payment) return null
  return {
    id: payment.id,
    bookingId: payment.booking_id,
    orderId: payment.midtrans_order_id,
    grossAmount: payment.gross_amount,
    status: payment.status,
    snapToken: payment.snap_token,
    snapRedirectUrl: payment.snap_redirect_url,
    paidAt: payment.paid_at,
  }
}

export function serializeSeat(seat: FlightSeat) {
  return {
    id: seat.id,
    flight_id: seat.flight_id,
    seat_label: seat.seat_label,
    seat_class: seat.seat_class,
    seat_type: seat.seat_type,
    row_number: seat.row_number,
    column_label: seat.column_label,
    price_modifier: seat.price_modifier,
    is_available: seat.is_available,
    passenger_id: seat.passenger_id,
  }
}

export function normalizePayment(payment: MaybePayment) {
  if (Array.isArray(payment)) return payment[0] ?? null
  return payment
}

export function serializeBookingSummary(booking: BookingDetail) {
  return {
    id: booking.id,
    bookingCode: booking.booking_code,
    status: booking.status,
    totalPrice: booking.total_price,
    passengerCount: booking.passenger_count,
    flight: serializeFlight(booking.flight),
    payment: serializePayment(normalizePayment(booking.payment)),
  }
}

export function serializeBookingDetail(booking: BookingDetail) {
  return {
    id: booking.id,
    userId: booking.user_id,
    bookingCode: booking.booking_code,
    status: booking.status,
    totalPrice: booking.total_price,
    passengerCount: booking.passenger_count,
    contactEmail: booking.contact_email,
    contactPhone: booking.contact_phone,
    createdAt: booking.created_at,
    expiresAt: booking.expires_at,
    rescheduleCount: booking.reschedule_count,
    creditBalance: booking.credit_balance,
    flight: serializeFlight(booking.flight),
    passengers: booking.passengers.map((passenger) => ({
      id: passenger.id,
      fullName: passenger.full_name,
      idType: passenger.id_type,
      idNumber: passenger.id_number,
      seatNumber: passenger.seat_number,
    })),
    payment: serializePayment(normalizePayment(booking.payment)),
  }
}
