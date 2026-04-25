import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateBookingCode } from '@/lib/utils'
import { BOOKING_EXPIRY_MINUTES } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { flightId, passengers, contactEmail, contactPhone } = await request.json()

    // Validate
    if (!flightId || !passengers?.length || !contactEmail || !contactPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const passengerCount = passengers.length

    // Use service client for atomic seat operations
    const serviceClient = await createServiceClient()

    // Check flight exists and has enough seats
    const { data: flight } = await serviceClient
      .from('flights')
      .select('id, price, available_seats')
      .eq('id', flightId)
      .single()

    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
    }

    if (flight.available_seats < passengerCount) {
      return NextResponse.json({
        error: `Kursi tidak cukup. Tersedia: ${flight.available_seats}`,
      }, { status: 400 })
    }

    // Atomic seat decrement
    const { data: seatResult } = await serviceClient.rpc('decrement_seats', {
      p_flight_id: flightId,
      p_count: passengerCount,
    })

    if (seatResult === -1) {
      return NextResponse.json({ error: 'Kursi tidak cukup' }, { status: 400 })
    }

    const bookingCode = generateBookingCode()
    const totalPrice = flight.price * passengerCount
    const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000).toISOString()

    // Create booking (use service client to bypass RLS — auth.uid() may be stale)
    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .insert({
        user_id: user.id,
        flight_id: flightId,
        booking_code: bookingCode,
        status: 'pending',
        total_price: totalPrice,
        passenger_count: passengerCount,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking insert error:', JSON.stringify(bookingError))
      // Rollback seats
      await serviceClient.rpc('restore_seats', { p_flight_id: flightId, p_count: passengerCount })
      return NextResponse.json({ error: `Failed to create booking: ${bookingError.message}` }, { status: 500 })
    }

    // Create passengers
    const { error: passengersError } = await serviceClient
      .from('passengers')
      .insert(
        passengers.map((p: { full_name: string; id_type: string; id_number: string }) => ({
          booking_id: booking.id,
          full_name: p.full_name,
          id_type: p.id_type,
          id_number: p.id_number,
        }))
      )

    if (passengersError) {
      console.error('Passengers insert error:', JSON.stringify(passengersError))
      // Rollback: cancel booking + restore seats
      await serviceClient.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await serviceClient.rpc('restore_seats', { p_flight_id: flightId, p_count: passengerCount })
      return NextResponse.json({ error: `Failed to create passengers: ${passengersError.message}` }, { status: 500 })
    }

    return NextResponse.json({ bookingId: booking.id, bookingCode })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
