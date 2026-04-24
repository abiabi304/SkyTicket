import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      signature_key,
      status_code,
      transaction_id,
      payment_type,
    } = body

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const supabase = await createServiceClient()

    // Determine payment status
    let paymentStatus = 'pending'
    let bookingStatus = 'pending'

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        paymentStatus = 'settlement'
        bookingStatus = 'paid'
      }
    } else if (transaction_status === 'deny') {
      paymentStatus = 'deny'
      bookingStatus = 'cancelled'
    } else if (transaction_status === 'cancel') {
      paymentStatus = 'cancel'
      bookingStatus = 'cancelled'
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expire'
      bookingStatus = 'expired'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
      bookingStatus = 'pending'
    }

    // Update payment
    const { data: payment } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        midtrans_transaction_id: transaction_id,
        payment_type,
        paid_at: paymentStatus === 'settlement' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('midtrans_order_id', order_id)
      .select()
      .single()

    if (payment) {
      // Atomically update booking status only if currently pending
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .update({
          status: bookingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.booking_id)
        .eq('status', 'pending')
        .select('flight_id, passenger_count')
        .single()

      // Restore seats atomically if booking was cancelled/expired
      if (
        updatedBooking &&
        (bookingStatus === 'cancelled' || bookingStatus === 'expired')
      ) {
        await supabase.rpc('restore_seats', {
          p_flight_id: updatedBooking.flight_id,
          p_count: updatedBooking.passenger_count,
        })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Midtrans notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
