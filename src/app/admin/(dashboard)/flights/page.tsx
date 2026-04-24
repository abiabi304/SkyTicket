import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatTime, formatDateShort } from '@/lib/utils'
import { DeleteFlightButton } from '@/components/admin/delete-flight-button'
import type { FlightWithDetails } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Penerbangan | Admin',
}

export default async function AdminFlightsPage() {
  const supabase = await createClient()

  const { data: flights } = await supabase
    .from('flights')
    .select(`
      *,
      airline:airlines(*),
      departure_airport:airports!flights_departure_airport_id_fkey(*),
      arrival_airport:airports!flights_arrival_airport_id_fkey(*)
    `)
    .order('departure_time', { ascending: true })

  const typedFlights = (flights ?? []) as unknown as FlightWithDetails[]

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Penerbangan</h1>
          <p className="text-sm text-muted-foreground">{typedFlights.length} penerbangan</p>
        </div>
        <Button asChild>
          <Link href="/admin/flights/new">
            <Plus className="mr-2 size-4" />
            Tambah Penerbangan
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {typedFlights.map((flight) => (
          <Card key={flight.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{flight.airline?.name}</span>
                  <span className="text-sm text-muted-foreground">{flight.flight_number}</span>
                  <Badge variant="secondary" className="capitalize">{flight.seat_class}</Badge>
                </div>
                <p className="text-sm">
                  {flight.departure_airport?.code} ({flight.departure_airport?.city}) → {flight.arrival_airport?.code} ({flight.arrival_airport?.city})
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(flight.departure_time)} • {formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)} • {flight.duration_minutes}m
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-4">
                  <p className="font-semibold">{formatRupiah(flight.price)}</p>
                  <p className="text-xs text-muted-foreground">{flight.available_seats} kursi</p>
                </div>
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/admin/flights/${flight.id}`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <DeleteFlightButton flightId={flight.id} flightNumber={flight.flight_number} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
