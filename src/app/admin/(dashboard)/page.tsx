import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, FileText, CreditCard, TrendingUp, MapPin, Building2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
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
      flight:flights(
        flight_number,
        departure_airport:airports!flights_departure_airport_id_fkey(code, city),
        arrival_airport:airports!flights_arrival_airport_id_fkey(code, city)
      )
    `).order('created_at', { ascending: false }).limit(5),
  ])

  const totalRevenue = (revenueData ?? []).reduce(
    (sum: number, b: { total_price: number }) => sum + b.total_price,
    0
  )

  const stats = [
    { label: 'Total Penerbangan', value: totalFlights ?? 0, icon: Plane, color: 'text-blue-600 bg-blue-100' },
    { label: 'Maskapai', value: totalAirlines ?? 0, icon: Building2, color: 'text-purple-600 bg-purple-100' },
    { label: 'Bandara', value: totalAirports ?? 0, icon: MapPin, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Total Booking', value: totalBookings ?? 0, icon: FileText, color: 'text-orange-600 bg-orange-100' },
    { label: 'Booking Lunas', value: paidBookings ?? 0, icon: CreditCard, color: 'text-green-600 bg-green-100' },
    { label: 'Total Revenue', value: formatRupiah(totalRevenue), icon: TrendingUp, color: 'text-primary bg-primary/10' },
  ]

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan data SkyTicket</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex size-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="size-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada booking</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const flight = booking.flight as unknown as {
                  flight_number: string
                  departure_airport: { code: string; city: string }
                  arrival_airport: { code: string; city: string }
                }
                return (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {booking.booking_code} — {flight?.departure_airport?.code} → {flight?.arrival_airport?.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {flight?.flight_number} • {booking.passenger_count} penumpang
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatRupiah(booking.total_price)}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        booking.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {booking.status === 'paid' ? 'Lunas' : booking.status === 'pending' ? 'Pending' : booking.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
