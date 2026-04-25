import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SeatLayout } from '@/lib/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ flightId: string }> }
) {
  try {
    const { flightId } = await params
    const supabase = await createClient()

    // Fetch flight with aircraft type
    const { data: flight, error: flightError } = await supabase
      .from('flights')
      .select('id, aircraft_type_id')
      .eq('id', flightId)
      .single()

    if (flightError || !flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
    }

    // If no aircraft type, return empty — seat selection will be skipped
    if (!flight.aircraft_type_id) {
      return NextResponse.json({ seats: [], layout: null })
    }

    // Fetch aircraft type for seat layout
    const { data: aircraftType } = await supabase
      .from('aircraft_types')
      .select('seat_layout')
      .eq('id', flight.aircraft_type_id)
      .single()

    const layout: SeatLayout | null = aircraftType?.seat_layout ?? null

    // Fetch all flight seats
    const { data: seats, error: seatsError } = await supabase
      .from('flight_seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('row_number', { ascending: true })
      .order('column_label', { ascending: true })

    if (seatsError) {
      return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 })
    }

    return NextResponse.json({ seats: seats ?? [], layout })
  } catch (error) {
    console.error('Fetch seats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
