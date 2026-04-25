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

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // Verify booking belongs to user and is in rescheduling state
    const { data: booking } = await serviceClient
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .eq('status', 'rescheduling')
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not in rescheduling state' }, { status: 404 })
    }

    // Find the pending reschedule for this booking
    const { data: reschedule } = await serviceClient
      .from('reschedules')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .single()

    if (!reschedule) {
      // No pending reschedule found — just restore booking to paid
      await serviceClient
        .from('bookings')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
      return NextResponse.json({ success: true })
    }

    // Expire the reschedule (reverses seat swap, restores booking to paid)
    const { data: expired } = await serviceClient.rpc('expire_reschedule', {
      p_reschedule_id: reschedule.id,
    })

    if (!expired) {
      return NextResponse.json({ error: 'Gagal membatalkan reschedule' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel reschedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
