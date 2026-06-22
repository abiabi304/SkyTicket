import { NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/mobile-api/auth'
import { isValidIndonesianPhone } from '@/lib/mobile-api/validators'
import { generateBookingCode } from '@/lib/utils'
import { BOOKING_EXPIRY_MINUTES } from '@/lib/constants'
import { rateLimit } from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if ('error' in auth) return auth.error

    const { serviceClient, user } = auth

    // Rate limit: 5 bookings per minute per user
    const { success: rateLimitOk } = await rateLimit(`booking:${user.id}`, 5, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 })
    }

    const { flightId, passengers, contactEmail, contactPhone, seatAssignments } = await request.json()

    // Validate required fields
    if (!flightId || !passengers?.length || !contactEmail || !contactPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidUUID(flightId)) {
      return NextResponse.json({ error: 'Invalid flightId' }, { status: 400 })
    }

    if (passengers.length < 1 || passengers.length > 5) {
      return NextResponse.json({ error: 'Jumlah penumpang harus 1-5' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    if (!isValidIndonesianPhone(contactPhone)) {
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

    if (seatAssignments != null && (typeof seatAssignments !== 'object' || Array.isArray(seatAssignments))) {
      return NextResponse.json({ error: 'Format pilihan kursi tidak valid' }, { status: 400 })
    }

    const rawSeatAssignmentMap = (seatAssignments ?? {}) as Record<string, unknown>
    const seatAssignmentMap = Object.fromEntries(
      Object.entries(rawSeatAssignmentMap).map(([passengerIndex, seatLabel]) => [passengerIndex, String(seatLabel).trim()])
    )
    const seatLabels = Object.values(seatAssignmentMap).filter(Boolean)
    const hasSeatAssignments = seatLabels.length > 0

    if (hasSeatAssignments) {
      if (seatLabels.length !== passengerCount) {
        return NextResponse.json({ error: 'Jumlah kursi yang dipilih harus sesuai jumlah penumpang' }, { status: 400 })
      }

      if (new Set(seatLabels).size !== seatLabels.length) {
        return NextResponse.json({ error: 'Kursi yang dipilih tidak boleh duplikat' }, { status: 400 })
      }
    }

    // Check flight exists and has enough seats
    const { data: flight } = await serviceClient
      .from('flights')
      .select('id, price, available_seats, aircraft_type_id, seat_class')
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

    if (hasSeatAssignments) {
      // Validate seat assignments and calculate modifiers
      const { data: seats, error: seatsError } = await serviceClient
        .from('flight_seats')
        .select('seat_label, seat_class, price_modifier, is_available')
        .eq('flight_id', flightId)
        .in('seat_label', seatLabels)

      if (seatsError) {
        return NextResponse.json({ error: 'Gagal memvalidasi kursi' }, { status: 500 })
      }

      if (!seats || seats.length !== seatLabels.length) {
        return NextResponse.json({ error: 'Kursi yang dipilih tidak ditemukan' }, { status: 400 })
      }

      for (const seat of seats) {
        if (!seat.is_available) {
          return NextResponse.json({ error: `Kursi ${seat.seat_label} sudah tidak tersedia` }, { status: 400 })
        }
        if (seat.seat_class !== flight.seat_class) {
          return NextResponse.json({ error: `Kursi ${seat.seat_label} tidak sesuai kelas penerbangan` }, { status: 400 })
        }
        seatModifierTotal += seat.price_modifier
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
      return NextResponse.json({ error: 'Gagal membuat booking' }, { status: 500 })
    }

    // Create passengers
    const passengerInserts = passengers.map((p: { full_name: string; id_type: string; id_number: string }, i: number) => ({
      booking_id: booking.id,
      full_name: p.full_name,
      id_type: p.id_type,
      id_number: p.id_number,
      seat_number: hasSeatAssignments ? (seatAssignmentMap[String(i)] ?? null) : null,
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
      return NextResponse.json({ error: 'Gagal membuat data penumpang' }, { status: 500 })
    }

    // Assign seats atomically if seat assignments provided
    if (hasSeatAssignments && createdPassengers.length > 0) {
      const assignments = createdPassengers.map((p, i) => ({
        passenger_id: p.id,
        seat_label: seatAssignmentMap[String(i)] ?? '',
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
          return NextResponse.json({ error: 'Gagal menetapkan kursi' }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ bookingId: booking.id, bookingCode })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
