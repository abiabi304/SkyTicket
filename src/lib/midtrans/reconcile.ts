import type { SupabaseClient } from '@supabase/supabase-js'
import { createCoreApiClient } from './config'

type MidtransStatusPayload = {
  order_id: string
  transaction_status?: string
  fraud_status?: string
  transaction_id?: string
  payment_type?: string
}

type PaymentRecord = {
  id: string
  booking_id: string
  midtrans_order_id: string
  midtrans_transaction_id: string | null
  payment_type: string | null
  status: string
  created_at: string
}

const TERMINAL_FAILURE_STATUSES = new Set(['deny', 'cancel', 'expire', 'failure'])

function getPaymentOutcome(payload: MidtransStatusPayload) {
  const transactionStatus = payload.transaction_status ?? 'pending'
  const fraudAccepted = payload.fraud_status === 'accept' || !payload.fraud_status
  const isSuccess = (transactionStatus === 'capture' || transactionStatus === 'settlement') && fraudAccepted
  const isTerminalFailure = TERMINAL_FAILURE_STATUSES.has(transactionStatus)

  if (isSuccess) {
    return { paymentStatus: 'settlement', isSuccess, isTerminalFailure: false }
  }

  if (isTerminalFailure) {
    return { paymentStatus: transactionStatus, isSuccess: false, isTerminalFailure }
  }

  return { paymentStatus: 'pending', isSuccess: false, isTerminalFailure: false }
}

export async function applyMidtransPaymentStatus(
  supabase: SupabaseClient,
  payload: MidtransStatusPayload
) {
  const { paymentStatus, isSuccess, isTerminalFailure } = getPaymentOutcome(payload)
  const now = new Date().toISOString()
  const paymentUpdate: Record<string, unknown> = {
    status: paymentStatus,
    updated_at: now,
  }

  if (payload.transaction_id) {
    paymentUpdate.midtrans_transaction_id = payload.transaction_id
  }

  if (payload.payment_type) {
    paymentUpdate.payment_type = payload.payment_type
  }

  if (isSuccess) {
    paymentUpdate.paid_at = now
  } else if (isTerminalFailure) {
    paymentUpdate.paid_at = null
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update(paymentUpdate)
    .eq('midtrans_order_id', payload.order_id)
    .select()
    .single()

  if (paymentError || !payment) {
    return { payment: null, paymentStatus, isSuccess, isTerminalFailure }
  }

  const typedPayment = payment as PaymentRecord
  const isReschedulePayment = payload.order_id.startsWith('RSC-')

  if (isReschedulePayment) {
    if (isSuccess) {
      const { data: reschedule } = await supabase
        .from('reschedules')
        .select('id')
        .eq('payment_id', typedPayment.id)
        .eq('status', 'pending')
        .single()

      if (reschedule) {
        await supabase.rpc('complete_reschedule', {
          p_reschedule_id: reschedule.id,
          p_payment_id: typedPayment.id,
        })
      }
    } else if (isTerminalFailure) {
      const { data: reschedule } = await supabase
        .from('reschedules')
        .select('id')
        .eq('payment_id', typedPayment.id)
        .eq('status', 'pending')
        .single()

      if (reschedule) {
        await supabase.rpc('expire_reschedule', {
          p_reschedule_id: reschedule.id,
        })
      }
    }

    return { payment: typedPayment, paymentStatus, isSuccess, isTerminalFailure }
  }

  if (isSuccess) {
    await supabase
      .from('bookings')
      .update({ status: 'paid', updated_at: now })
      .eq('id', typedPayment.booking_id)
      .eq('status', 'pending')
  } else if (isTerminalFailure) {
    const bookingStatus = paymentStatus === 'expire' ? 'expired' : 'cancelled'

    const { data: updatedBooking } = await supabase
      .from('bookings')
      .update({ status: bookingStatus, updated_at: now })
      .eq('id', typedPayment.booking_id)
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

  return { payment: typedPayment, paymentStatus, isSuccess, isTerminalFailure }
}

export async function reconcileLatestBookingPayment(
  supabase: SupabaseClient,
  bookingId: string
) {
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)

  const payment = Array.isArray(payments) ? payments[0] as PaymentRecord | undefined : undefined

  if (!payment?.midtrans_order_id) {
    return { reconciled: false }
  }

  try {
    if (payment.status !== 'pending') {
      await applyMidtransPaymentStatus(supabase, {
        order_id: payment.midtrans_order_id,
        transaction_status: payment.status,
        transaction_id: payment.midtrans_transaction_id ?? undefined,
        payment_type: payment.payment_type ?? undefined,
      })

      return { reconciled: true, orderId: payment.midtrans_order_id }
    }

    const core = createCoreApiClient()
    const status = await core.transaction.status(payment.midtrans_order_id) as MidtransStatusPayload
    await applyMidtransPaymentStatus(supabase, status)

    return { reconciled: true, orderId: payment.midtrans_order_id }
  } catch (error) {
    console.error('[MIDTRANS RECONCILE] Failed to reconcile payment:', error)
    return { reconciled: false, orderId: payment.midtrans_order_id }
  }
}