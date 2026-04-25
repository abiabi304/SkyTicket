import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createSnapClient } from '@/lib/midtrans/config'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rescheduleId } = await request.json()

    if (!rescheduleId) {
      return NextResponse.json({ error: 'Missing rescheduleId' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Fetch reschedule with booking details
    const { data: reschedule } = await serviceClient
      .from('reschedules')
      .select(`
        *,
        booking:bookings(
          *,
          flight:flights!bookings_flight_id_fkey(
            *,
            airline:airlines(*),
            departure_airport:airports!flights_departure_airport_id_fkey(*),
            arrival_airport:airports!flights_arrival_airport_id_fkey(*)
          )
        )
      `)
      .eq('id', rescheduleId)
      .eq('status', 'pending')
      .single()

    if (!reschedule) {
      return NextResponse.json({ error: 'Reschedule not found or already processed' }, { status: 404 })
    }

    const booking = reschedule.booking as Record<string, unknown>

    // Verify ownership
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check expiry
    if (reschedule.expires_at && new Date(reschedule.expires_at) < new Date()) {
      await serviceClient.rpc('expire_reschedule', { p_reschedule_id: rescheduleId })
      return NextResponse.json({ error: 'Reschedule has expired' }, { status: 400 })
    }

    const orderId = `RSC-${(booking.booking_code as string)}-${Date.now()}`
    const snap = createSnapClient()

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: reschedule.amount_due,
      },
      customer_details: {
        first_name: user.user_metadata?.full_name ?? user.email,
        email: (booking.contact_email as string) ?? user.email,
        phone: (booking.contact_phone as string) ?? '',
      },
      item_details: [
        {
          id: `reschedule-${rescheduleId}`,
          price: reschedule.amount_due,
          quantity: 1,
          name: `Reschedule Fee - ${(booking.booking_code as string)}`,
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/my-bookings/${booking.id}`,
      },
    }

    const transaction = await snap.createTransaction(parameter)

    // Save payment record
    const { data: payment } = await serviceClient.from('payments').insert({
      booking_id: booking.id,
      midtrans_order_id: orderId,
      gross_amount: reschedule.amount_due,
      status: 'pending',
      snap_token: transaction.token,
      snap_redirect_url: transaction.redirect_url,
    }).select().single()

    // Link payment to reschedule
    if (payment) {
      await serviceClient
        .from('reschedules')
        .update({ payment_id: payment.id })
        .eq('id', rescheduleId)
    }

    return NextResponse.json({
      snapToken: transaction.token,
      orderId,
    })
  } catch (error) {
    console.error('Reschedule pay error:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
