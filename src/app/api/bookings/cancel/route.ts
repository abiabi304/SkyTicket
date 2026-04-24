import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await request.json()

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
