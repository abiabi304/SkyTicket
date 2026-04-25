import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { isValidUUID } from '@/lib/validators'
import { RESCHEDULE_FEE } from '@/lib/constants'
import type { RescheduleInitResult } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = await rateLimit(`reschedule:${user.id}`, 5, 60000)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 })
    }

    const { bookingId, newFlightId } = await request.json()

    if (!bookingId || !newFlightId) {
      return NextResponse.json({ error: 'Missing bookingId or newFlightId' }, { status: 400 })
    }

    if (!isValidUUID(bookingId) || !isValidUUID(newFlightId)) {
      return NextResponse.json({ error: 'Invalid bookingId or newFlightId' }, { status: 400 })
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
      p_reschedule_fee: RESCHEDULE_FEE,
    })

    if (error) {
      // RPC raises user-friendly exceptions — return those
      const message = error.message || 'Reschedule gagal'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const result = data as unknown as RescheduleInitResult

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reschedule initiate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
