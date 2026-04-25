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
    const isSuccess = (transaction_status === 'capture' || transaction_status === 'settlement')
      && (fraud_status === 'accept' || !fraud_status)

    if (isSuccess) {
      paymentStatus = 'settlement'
    } else if (transaction_status === 'deny') {
      paymentStatus = 'deny'
    } else if (transaction_status === 'cancel') {
      paymentStatus = 'cancel'
    } else if (transaction_status === 'expire') {
      paymentStatus = 'expire'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
    }

    // Update payment record
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

    if (!payment) {
      return NextResponse.json({ status: 'ok' })
    }

    // Check if this is a reschedule payment (order_id starts with RSC-)
    const isReschedulePayment = (order_id as string).startsWith('RSC-')

    if (isReschedulePayment) {
      // Handle reschedule payment
      if (isSuccess) {
        // Find the pending reschedule linked to this payment
        const { data: reschedule } = await supabase
          .from('reschedules')
          .select('id')
          .eq('payment_id', payment.id)
          .eq('status', 'pending')
          .single()

        if (reschedule) {
          await supabase.rpc('complete_reschedule', {
            p_reschedule_id: reschedule.id,
            p_payment_id: payment.id,
          })
        }
      } else if (paymentStatus === 'deny' || paymentStatus === 'cancel' || paymentStatus === 'expire') {
        // Payment failed — expire the reschedule (reverse seat swap)
        const { data: reschedule } = await supabase
          .from('reschedules')
          .select('id')
          .eq('payment_id', payment.id)
          .eq('status', 'pending')
          .single()

        if (reschedule) {
          await supabase.rpc('expire_reschedule', {
            p_reschedule_id: reschedule.id,
          })
        }
      }
    } else {
      // Handle regular booking payment
      if (isSuccess) {
        await supabase
          .from('bookings')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', payment.booking_id)
          .eq('status', 'pending')
      } else if (paymentStatus === 'deny' || paymentStatus === 'cancel' || paymentStatus === 'expire') {
        const bookingStatus = paymentStatus === 'expire' ? 'expired' : 'cancelled'

        const { data: updatedBooking } = await supabase
          .from('bookings')
          .update({ status: bookingStatus, updated_at: new Date().toISOString() })
          .eq('id', payment.booking_id)
          .eq('status', 'pending')
          .select('flight_id, passenger_count')
          .single()

        if (updatedBooking) {
          await supabase.rpc('restore_seats', {
            p_flight_id: updatedBooking.flight_id,
            p_count: updatedBooking.passenger_count,
          })
        }
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
