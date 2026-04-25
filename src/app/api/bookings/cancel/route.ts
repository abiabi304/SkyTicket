import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/validators'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = await rateLimit(`cancel:${user.id}`, 5, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 })
    }

    const { bookingId } = await request.json()

    if (!bookingId || !isValidUUID(bookingId)) {
      return NextResponse.json({ error: 'Invalid bookingId' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Atomic cancel: only cancels if status is 'pending', restores seats
    const { data: result } = await serviceClient.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    })

    if (!result) {
      return NextResponse.json({
        error: 'Booking tidak dapat dibatalkan (sudah dibayar atau sudah dibatalkan)',
      }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
