import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { applyMidtransPaymentStatus } from '@/lib/midtrans/reconcile'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      order_id,
      gross_amount,
      signature_key,
      status_code,
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
    await applyMidtransPaymentStatus(supabase, body)

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Midtrans notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}