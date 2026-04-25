import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, Plane, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatRupiah, formatTime, formatDateShort } from '@/lib/utils'
import { DeleteFlightButton } from '@/components/admin/delete-flight-button'
import { FlightsFilter, FlightsPagination } from '@/components/admin/flights-table'
import type { FlightWithDetails, Airline } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Penerbangan | Admin',
}

const PER_PAGE = 20

export default async function AdminFlightsPage({
  searchParams,
}: {
  searchParams: { search?: string; airline?: string; class?: string; page?: string }
}) {
  const supabase = await createClient()

  // Fetch airlines for filter dropdown
  const { data: airlines } = await supabase
    .from('airlines')
    .select('*')
    .order('name')

  // Build query with filters
  let query = supabase
    .from('flights')
    .select(
      `
      *,
      airline:airlines(*),
      departure_airport:airports!flights_departure_airport_id_fkey(*),
      arrival_airport:airports!flights_arrival_airport_id_fkey(*)
    `,
      { count: 'exact' }
    )

  // Filter by airline
  if (searchParams.airline) {
    query = query.eq('airline_id', searchParams.airline)
  }

  // Filter by seat class
  if (searchParams.class) {
    query = query.eq('seat_class', searchParams.class)
  }

  // Filter by search (flight number)
  if (searchParams.search) {
    query = query.ilike('flight_number', `%${searchParams.search}%`)
  }

  // Get total count first
  const { count: totalCount } = await query

  // Pagination
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const total = totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const from = (safePage - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  // Re-build query with pagination (Supabase doesn't allow reusing query after count)
  let dataQuery = supabase
    .from('flights')
    .select(
      `
      *,
      airline:airlines(*),
      departure_airport:airports!flights_departure_airport_id_fkey(*),
      arrival_airport:airports!flights_arrival_airport_id_fkey(*)
    `
    )

  if (searchParams.airline) {
    dataQuery = dataQuery.eq('airline_id', searchParams.airline)
  }
  if (searchParams.class) {
    dataQuery = dataQuery.eq('seat_class', searchParams.class)
  }
  if (searchParams.search) {
    dataQuery = dataQuery.ilike('flight_number', `%${searchParams.search}%`)
  }

  const { data: flights } = await dataQuery
    .order('departure_time', { ascending: true })
    .range(from, to)

  const typedFlights = (flights ?? []) as unknown as FlightWithDetails[]
  const typedAirlines = (airlines ?? []) as Airline[]

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penerbangan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua jadwal penerbangan
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/flights/new">
            <Plus className="mr-2 size-4" />
            Tambah Penerbangan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <FlightsFilter
        airlines={typedAirlines}
        search={searchParams.search ?? ''}
        airline={searchParams.airline ?? ''}
        seatClass={searchParams.class ?? ''}
      />

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {total} penerbangan ditemukan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {typedFlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                <Plane className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada penerbangan ditemukan
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Coba ubah filter pencarian
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Penerbangan</TableHead>
                  <TableHead className="font-semibold">Rute</TableHead>
                  <TableHead className="font-semibold">Tanggal & Waktu</TableHead>
                  <TableHead className="font-semibold">Kelas</TableHead>
                  <TableHead className="font-semibold text-right">Harga</TableHead>
                  <TableHead className="font-semibold text-center">Kursi</TableHead>
                  <TableHead className="font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedFlights.map((flight) => (
                  <TableRow key={flight.id}>
                    {/* Flight # + Airline */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {flight.airline?.code}
                        </div>
                        <div>
                          <p className="font-medium">{flight.flight_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {flight.airline?.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Route */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium">
                          {flight.departure_airport?.code}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span className="font-medium">
                          {flight.arrival_airport?.code}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {flight.departure_airport?.city} — {flight.arrival_airport?.city}
                      </p>
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell>
                      <p className="text-sm font-medium">
                        {formatDateShort(flight.departure_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(flight.departure_time)} – {formatTime(flight.arrival_time)} ({flight.duration_minutes}m)
                      </p>
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          flight.seat_class === 'business'
                            ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100'
                        }
                      >
                        {flight.seat_class === 'business' ? 'Business' : 'Economy'}
                      </Badge>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-right">
                      <p className="font-semibold">{formatRupiah(flight.price)}</p>
                    </TableCell>

                    {/* Seats */}
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex min-w-[2rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          flight.available_seats <= 5
                            ? 'bg-red-100 text-red-700'
                            : flight.available_seats <= 20
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {flight.available_seats}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="icon" className="size-8" asChild>
                          <Link href={`/admin/flights/${flight.id}`}>
                            <Pencil className="size-3.5" />
                          </Link>
                        </Button>
                        <DeleteFlightButton
                          flightId={flight.id}
                          flightNumber={flight.flight_number}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <FlightsPagination
        totalCount={total}
        currentPage={safePage}
        totalPages={totalPages}
      />
    </div>
  )
}
