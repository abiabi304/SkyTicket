import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plane,
  FileText,
  CreditCard,
  TrendingUp,
  MapPin,
  Building2,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { formatRupiah, formatDateShort, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | SkyTicket',
}

export default async function AdminDashboardPage() {
  const supabase = await createServiceClient()

  const [
    { count: totalFlights },
    { count: totalAirlines },
    { count: totalAirports },
    { count: totalBookings },
    { count: paidBookings },
    { data: revenueData },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from('flights').select('*', { count: 'exact', head: true }),
    supabase.from('airlines').select('*', { count: 'exact', head: true }),
    supabase.from('airports').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('bookings').select('total_price').eq('status', 'paid'),
    supabase.from('bookings').select(`
      id, booking_code, status, total_price, passenger_count, created_at,
        flight:flights!bookings_flight_id_fkey(
        flight_number,
        departure_airport:airports!flights_departure_airport_id_fkey(code, city),
        arrival_airport:airports!flights_arrival_airport_id_fkey(code, city)
      )
    `).order('created_at', { ascending: false }).limit(8),
  ])

  const totalRevenue = (revenueData ?? []).reduce(
    (sum: number, b: { total_price: number }) => sum + b.total_price,
    0
  )

  const stats = [
    { label: 'Total Penerbangan', value: totalFlights ?? 0, icon: Plane, color: 'text-blue-600 bg-blue-50', href: '/admin/flights' },
    { label: 'Maskapai', value: totalAirlines ?? 0, icon: Building2, color: 'text-violet-600 bg-violet-50', href: '/admin/airlines' },
    { label: 'Bandara', value: totalAirports ?? 0, icon: MapPin, color: 'text-emerald-600 bg-emerald-50', href: '/admin/airports' },
    { label: 'Total Booking', value: totalBookings ?? 0, icon: FileText, color: 'text-orange-600 bg-orange-50', href: null },
    { label: 'Booking Lunas', value: paidBookings ?? 0, icon: CreditCard, color: 'text-green-600 bg-green-50', href: null },
    { label: 'Total Revenue', value: formatRupiah(totalRevenue), icon: TrendingUp, color: 'text-primary bg-primary/10', href: null },
  ]

  const quickActions = [
    { label: 'Tambah Penerbangan', href: '/admin/flights/new', icon: Plane, color: 'text-blue-600 bg-blue-50' },
    { label: 'Tambah Maskapai', href: '/admin/airlines/new', icon: Building2, color: 'text-violet-600 bg-violet-50' },
    { label: 'Tambah Bandara', href: '/admin/airports/new', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
  ]

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan data SkyTicket</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold tracking-tight truncate">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent bookings — takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Booking Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!recentBookings || recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                  <FileText className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada booking</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Kode</TableHead>
                    <TableHead className="font-semibold">Rute</TableHead>
                    <TableHead className="font-semibold">Penumpang</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => {
                    const flight = booking.flight as unknown as {
                      flight_number: string
                      departure_airport: { code: string; city: string }
                      arrival_airport: { code: string; city: string }
                    }
                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <p className="font-mono text-sm font-semibold">{booking.booking_code}</p>
                          <p className="text-xs text-muted-foreground">{formatDateShort(booking.created_at)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-medium">{flight?.departure_airport?.code}</span>
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <span className="font-medium">{flight?.arrival_airport?.code}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{flight?.flight_number}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{booking.passenger_count} pax</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-sm font-semibold">{formatRupiah(booking.total_price)}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBookingStatusColor(booking.status)}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                asChild
              >
                <Link href={action.href}>
                  <div className={`flex size-8 items-center justify-center rounded-md ${action.color}`}>
                    <action.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                  <Plus className="ml-auto size-4 text-muted-foreground" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
