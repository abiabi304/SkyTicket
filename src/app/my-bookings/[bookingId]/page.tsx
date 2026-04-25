export const dynamic = 'force-dynamic'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Footer } from '@/components/layout/footer'
import { PageHeader } from '@/components/shared/page-header'
import { FlightSummaryCard } from '@/components/booking/flight-summary-card'
import { ETicket } from '@/components/my-bookings/e-ticket'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CancelBookingButton } from '@/components/my-bookings/cancel-booking-button'
import { CancelRescheduleButton } from '@/components/my-bookings/cancel-reschedule-button'
import { CalendarClock, Info, Clock, CheckCircle2, Plane } from 'lucide-react'
import { formatRupiah, getBookingStatusColor, getBookingStatusLabel, getFlightStatus } from '@/lib/utils'
import { MAX_RESCHEDULES } from '@/lib/constants'
import type { BookingWithDetails, Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detail Pesanan',
}

interface BookingDetailPageProps {
  params: { bookingId: string }
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = await createServiceClient()

  const [{ data: booking }, { data: profile }] = await Promise.all([
    serviceClient
      .from('bookings')
      .select(`
        *,
        flight:flights!bookings_flight_id_fkey(
          *,
          airline:airlines(*),
          departure_airport:airports!flights_departure_airport_id_fkey(*),
          arrival_airport:airports!flights_arrival_airport_id_fkey(*)
        ),
        passengers(*),
        payment:payments(*)
      `)
      .eq('id', params.bookingId)
      .eq('user_id', user.id)
      .single(),
    serviceClient.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!booking) redirect('/my-bookings')

  const typedBooking = {
    ...booking,
    payment: Array.isArray(booking.payment) ? booking.payment[0] ?? null : booking.payment,
  } as unknown as BookingWithDetails

  // Check if reschedule is possible
  const departureTime = new Date(typedBooking.flight.departure_time)
  const hoursUntilDeparture = (departureTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const canReschedule =
    typedBooking.status === 'paid' &&
    typedBooking.reschedule_count < MAX_RESCHEDULES &&
    hoursUntilDeparture >= 24

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <div className="flex items-start justify-between">
            <PageHeader title="Detail Pesanan" showBack />
            <Badge
              variant="outline"
              className={getBookingStatusColor(typedBooking.status)}
            >
              {getBookingStatusLabel(typedBooking.status)}
            </Badge>
          </div>

          <div className="mt-6 space-y-6">
            {/* Booking code */}
            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Kode Booking</p>
                  <p className="font-mono text-2xl font-bold text-primary">
                    {typedBooking.booking_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{formatRupiah(typedBooking.total_price)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Rescheduling status banner + actions */}
            {typedBooking.status === 'rescheduling' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Proses Reschedule Sedang Berlangsung</p>
                      <p className="mt-1 text-blue-700">
                        Menunggu pembayaran selisih harga. Anda dapat membatalkan reschedule untuk mengembalikan booking ke status semula.
                      </p>
                    </div>
                  </div>
                  <CancelRescheduleButton bookingId={typedBooking.id} />
                </CardContent>
              </Card>
            )}

            {/* Reschedule info */}
            {typedBooking.reschedule_count > 0 && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="flex items-center gap-3 pt-4">
                  <CalendarClock className="size-4 shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Telah di-reschedule {typedBooking.reschedule_count}x
                    {typedBooking.credit_balance > 0 && (
                      <> • Saldo kredit: {formatRupiah(typedBooking.credit_balance)}</>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Flight status */}
            {typedBooking.status === 'paid' && (() => {
              const flightStatus = getFlightStatus(typedBooking.flight.departure_time, typedBooking.flight.arrival_time)
              const statusConfig = {
                upcoming: { icon: Clock, label: 'Belum Berangkat', color: 'border-blue-200 bg-blue-50 text-blue-700' },
                departed: { icon: Plane, label: 'Sedang Dalam Penerbangan', color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
                completed: { icon: CheckCircle2, label: 'Penerbangan Selesai', color: 'border-green-200 bg-green-50 text-green-700' },
              }
              const config = statusConfig[flightStatus]
              const StatusIcon = config.icon
              return (
                <Card className={`${config.color} border`}>
                  <CardContent className="flex items-center gap-3 pt-4">
                    <StatusIcon className="size-4 shrink-0" />
                    <p className="text-sm font-medium">{config.label}</p>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Flight info */}
            <FlightSummaryCard flight={typedBooking.flight} />

            {/* Passengers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Penumpang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typedBooking.passengers.map((p, i) => (
                  <div key={p.id}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{p.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.id_type.toUpperCase()}: {p.id_number}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Penumpang {i + 1}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* E-Ticket (only for paid bookings) */}
            {typedBooking.status === 'paid' && (
              <ETicket booking={typedBooking} />
            )}

            {/* Actions */}
            {typedBooking.status === 'paid' && (
              <div className="space-y-3">
                {canReschedule && (
                  <Button asChild variant="outline" className="w-full gap-2" size="lg">
                    <Link href={`/reschedule/${typedBooking.id}`}>
                      <CalendarClock className="size-4" />
                      Reschedule Penerbangan
                    </Link>
                  </Button>
                )}
                {!canReschedule && typedBooking.reschedule_count >= MAX_RESCHEDULES && (
                  <p className="text-center text-sm text-muted-foreground">
                    Batas reschedule telah tercapai ({MAX_RESCHEDULES}x)
                  </p>
                )}
                {!canReschedule && hoursUntilDeparture < 24 && typedBooking.reschedule_count < MAX_RESCHEDULES && (
                  <p className="text-center text-sm text-muted-foreground">
                    Reschedule tidak tersedia (kurang dari 24 jam sebelum keberangkatan)
                  </p>
                )}
              </div>
            )}

            {typedBooking.status === 'pending' && (
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href={`/payment/${typedBooking.id}`}>
                    Lanjutkan Pembayaran
                  </Link>
                </Button>
                <CancelBookingButton
                  bookingId={typedBooking.id}
                  bookingCode={typedBooking.booking_code}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
