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

    const { success: rateLimitOk } = await rateLimit(`expire:${user.id}`, 10, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 })
    }

    const { bookingId } = await request.json()

    if (!bookingId || !isValidUUID(bookingId)) {
      return NextResponse.json({ error: 'Invalid bookingId' }, { status: 400 })
    }

    // Use service client for all data operations
    const serviceClient = await createServiceClient()

    // Verify booking belongs to user
    const { data: booking } = await serviceClient
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 })
    }
    const { data: expired } = await serviceClient.rpc('expire_booking', {
      p_booking_id: bookingId,
    })

    if (!expired) {
      return NextResponse.json({
        error: 'Booking tidak dapat di-expire (sudah dibayar atau belum kadaluarsa)',
      }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expire booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
