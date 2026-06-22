import { NextResponse } from 'next/server'
import { requireAuthenticatedUser } from '@/lib/mobile-api/auth'
import { isValidUUID } from '@/lib/validators'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    if ('error' in auth) return auth.error

    const { serviceClient, user } = auth

    const { success: rateLimitOk } = await rateLimit(`cancel:${user.id}`, 5, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan' }, { status: 429 })
    }

    const { bookingId } = await request.json()

    if (!bookingId || !isValidUUID(bookingId)) {
      return NextResponse.json({ error: 'Invalid bookingId' }, { status: 400 })
    }

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

    await serviceClient
      .from('payments')
      .update({ status: 'cancel', updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
