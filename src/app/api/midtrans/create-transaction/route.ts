import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createSnapClient } from '@/lib/midtrans/config'
import { rateLimit } from '@/lib/rate-limit'
import type { BookingWithDetails } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = rateLimit(`payment:${user.id}`, 10, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 })
    }

    const { bookingId } = await request.json()

    // Use service client for all data operations (auth.uid() may be stale in RLS)
    const serviceClient = await createServiceClient()

    // Fetch booking with details
    const { data: booking, error: bookingError } = await serviceClient
      .from('bookings')
      .select(`
        *,
        flight:flights!bookings_flight_id_fkey(
          *,
          airline:airlines(*),
          departure_airport:airports!flights_departure_airport_id_fkey(*),
          arrival_airport:airports!flights_arrival_airport_id_fkey(*)
        ),
        passengers(*)
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const typedBooking = booking as unknown as BookingWithDetails

    if (typedBooking.status !== 'pending') {
      return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 })
    }
    await serviceClient
      .from('payments')
      .delete()
      .eq('booking_id', bookingId)
      .eq('status', 'pending')

    // Check expiry — atomically expire + restore seats via RPC
    if (typedBooking.expires_at && new Date(typedBooking.expires_at) < new Date()) {
      await serviceClient.rpc('expire_booking', { p_booking_id: bookingId })
      return NextResponse.json({ error: 'Booking has expired' }, { status: 400 })
    }

    const orderId = `SKY-${typedBooking.booking_code}-${Date.now()}`
    const snap = createSnapClient()

    // Build item details — Midtrans requires sum(price*qty) === gross_amount
    const itemDetails: Array<{ id: string; price: number; quantity: number; name: string }> = []

    // Base ticket price
    const baseTotal = typedBooking.flight.price * typedBooking.passenger_count
    itemDetails.push({
      id: typedBooking.flight.id,
      price: typedBooking.flight.price,
      quantity: typedBooking.passenger_count,
      name: `${typedBooking.flight.airline.name} ${typedBooking.flight.flight_number} (${typedBooking.flight.departure_airport.code}-${typedBooking.flight.arrival_airport.code})`,
    })

    // Seat modifier (difference between total_price and base ticket)
    const seatModifier = typedBooking.total_price - baseTotal
    if (seatModifier > 0) {
      itemDetails.push({
        id: 'seat-modifier',
        price: seatModifier,
        quantity: 1,
        name: 'Biaya pemilihan kursi',
      })
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: typedBooking.total_price,
      },
      customer_details: {
        first_name: user.user_metadata?.full_name ?? user.email,
        email: typedBooking.contact_email ?? user.email,
        phone: typedBooking.contact_phone ?? '',
      },
      item_details: itemDetails,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/status/${bookingId}`,
      },
    }

    const transaction = await snap.createTransaction(parameter)

    // Save payment record (use service client to bypass RLS)
    const { error: paymentError } = await serviceClient.from('payments').insert({
      booking_id: bookingId,
      midtrans_order_id: orderId,
      gross_amount: typedBooking.total_price,
      status: 'pending',
      snap_token: transaction.token,
      snap_redirect_url: transaction.redirect_url,
    })

    if (paymentError) {
      console.error('Payment insert error:', JSON.stringify(paymentError))
      return NextResponse.json(
        { error: 'Failed to save payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      snapToken: transaction.token,
      orderId,
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
