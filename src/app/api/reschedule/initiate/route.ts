import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { RescheduleInitResult } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, newFlightId } = await request.json()

    if (!bookingId || !newFlightId) {
      return NextResponse.json({ error: 'Missing bookingId or newFlightId' }, { status: 400 })
    }

    // Use service client for all data operations
    const serviceClient = await createServiceClient()

    // Verify booking belongs to user
    const { data: booking } = await serviceClient
      .from('bookings')
      .select('id, user_id')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    const { data, error } = await serviceClient.rpc('reschedule_booking', {
      p_booking_id: bookingId,
      p_new_flight_id: newFlightId,
      p_reschedule_fee: 50000,
    })

    if (error) {
      // Parse Postgres exception message
      const message = error.message || 'Reschedule failed'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const result = data as unknown as RescheduleInitResult

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reschedule initiate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
