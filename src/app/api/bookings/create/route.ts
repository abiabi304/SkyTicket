import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateBookingCode } from '@/lib/utils'
import { BOOKING_EXPIRY_MINUTES } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 5 bookings per minute per user
    const { success: rateLimitOk } = rateLimit(`booking:${user.id}`, 5, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 })
    }

    const { flightId, passengers, contactEmail, contactPhone, seatAssignments } = await request.json()

    // Validate required fields
    if (!flightId || !passengers?.length || !contactEmail || !contactPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (passengers.length < 1 || passengers.length > 5) {
      return NextResponse.json({ error: 'Jumlah penumpang harus 1-5' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    const phoneClean = contactPhone.replace(/[\s\-()]/g, '')
    if (!/^(\+62|62|0)8\d{7,12}$/.test(phoneClean)) {
      return NextResponse.json({ error: 'Format nomor telepon tidak valid' }, { status: 400 })
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i]
      if (!p.full_name || p.full_name.trim().length < 3) {
        return NextResponse.json({ error: `Nama penumpang ${i + 1} minimal 3 karakter` }, { status: 400 })
      }
      if (p.full_name.trim().length > 100) {
        return NextResponse.json({ error: `Nama penumpang ${i + 1} terlalu panjang` }, { status: 400 })
      }
      if (!p.id_type || !['ktp', 'paspor'].includes(p.id_type)) {
        return NextResponse.json({ error: `Tipe identitas penumpang ${i + 1} tidak valid` }, { status: 400 })
      }
      if (!p.id_number || p.id_number.trim().length < 6 || p.id_number.trim().length > 20) {
        return NextResponse.json({ error: `Nomor identitas penumpang ${i + 1} tidak valid (6-20 karakter)` }, { status: 400 })
      }
    }

    const passengerCount = passengers.length
    const serviceClient = await createServiceClient()

    // Check flight exists and has enough seats
    const { data: flight } = await serviceClient
      .from('flights')
      .select('id, price, available_seats, aircraft_type_id')
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

    // Calculate total price including seat modifiers
    let seatModifierTotal = 0
    const hasSeatAssignments = seatAssignments && Object.keys(seatAssignments).length > 0

    if (hasSeatAssignments) {
      // Validate seat assignments and calculate modifiers
      const seatLabels = Object.values(seatAssignments) as string[]
      const { data: seats } = await serviceClient
        .from('flight_seats')
        .select('seat_label, price_modifier, is_available')
        .eq('flight_id', flightId)
        .in('seat_label', seatLabels)

      if (seats) {
        for (const seat of seats) {
          if (!seat.is_available) {
            return NextResponse.json({ error: `Kursi ${seat.seat_label} sudah tidak tersedia` }, { status: 400 })
          }
          seatModifierTotal += seat.price_modifier
        }
      }
    }

    // Atomic seat decrement (for flights without seat map, or as fallback)
    if (!hasSeatAssignments) {
      const { data: seatResult } = await serviceClient.rpc('decrement_seats', {
        p_flight_id: flightId,
        p_count: passengerCount,
      })
      if (seatResult === -1) {
        return NextResponse.json({ error: 'Kursi tidak cukup' }, { status: 400 })
      }
    }

    const bookingCode = generateBookingCode()
    const totalPrice = (flight.price * passengerCount) + seatModifierTotal
    const expiresAt = new Date(Date.now() + BOOKING_EXPIRY_MINUTES * 60 * 1000).toISOString()

    // Create booking
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
      if (!hasSeatAssignments) {
        await serviceClient.rpc('restore_seats', { p_flight_id: flightId, p_count: passengerCount })
      }
      return NextResponse.json({ error: `Failed to create booking: ${bookingError.message}` }, { status: 500 })
    }

    // Create passengers
    const passengerInserts = passengers.map((p: { full_name: string; id_type: string; id_number: string }, i: number) => ({
      booking_id: booking.id,
      full_name: p.full_name,
      id_type: p.id_type,
      id_number: p.id_number,
      seat_number: hasSeatAssignments ? (seatAssignments[String(i)] ?? null) : null,
    }))

    const { data: createdPassengers, error: passengersError } = await serviceClient
      .from('passengers')
      .insert(passengerInserts)
      .select()

    if (passengersError || !createdPassengers) {
      console.error('Passengers insert error:', JSON.stringify(passengersError))
      await serviceClient.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      if (!hasSeatAssignments) {
        await serviceClient.rpc('restore_seats', { p_flight_id: flightId, p_count: passengerCount })
      }
      return NextResponse.json({ error: `Failed to create passengers: ${passengersError?.message}` }, { status: 500 })
    }

    // Assign seats atomically if seat assignments provided
    if (hasSeatAssignments && createdPassengers.length > 0) {
      const assignments = createdPassengers.map((p, i) => ({
        passenger_id: p.id,
        seat_label: seatAssignments[String(i)] ?? '',
      })).filter(a => a.seat_label)

      if (assignments.length > 0) {
        const { error: seatError } = await serviceClient.rpc('assign_seats', {
          p_flight_id: flightId,
          p_seat_assignments: assignments,
        })

        if (seatError) {
          console.error('Seat assignment error:', JSON.stringify(seatError))
          // Rollback everything
          await serviceClient.from('passengers').delete().eq('booking_id', booking.id)
          await serviceClient.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
          return NextResponse.json({ error: seatError.message || 'Gagal menetapkan kursi' }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ bookingId: booking.id, bookingCode })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
