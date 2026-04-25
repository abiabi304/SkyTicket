import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

    // Verify reschedule belongs to user's booking
    const { data: reschedule } = await serviceClient
      .from('reschedules')
      .select('id, booking:bookings!inner(user_id)')
      .eq('id', rescheduleId)
      .eq('status', 'pending')
      .single()

    if (!reschedule) {
      return NextResponse.json({ error: 'Reschedule not found' }, { status: 404 })
    }

    const booking = reschedule.booking as unknown as { user_id: string }
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: expired } = await serviceClient.rpc('expire_reschedule', {
      p_reschedule_id: rescheduleId,
    })

    if (!expired) {
      return NextResponse.json({
        error: 'Reschedule tidak dapat di-expire',
      }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expire reschedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
