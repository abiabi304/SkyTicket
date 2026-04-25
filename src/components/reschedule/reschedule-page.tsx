'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { PageHeader } from '@/components/shared/page-header'
import { FlightSummaryCard } from '@/components/booking/flight-summary-card'
import { RescheduleFlightCard } from './reschedule-flight-card'
import { RescheduleSummary } from './reschedule-summary'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, ArrowRight, CalendarClock, Plane } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'
import { RESCHEDULE_FEE, MAX_RESCHEDULES } from '@/lib/constants'
import type { BookingWithDetails, FlightWithDetails, RescheduleInitResult } from '@/lib/types'

declare global {
  interface Window {
    snap: {
      embed: (
        token: string,
        options: {
          embedId: string
          onSuccess?: (result: Record<string, unknown>) => void
          onPending?: (result: Record<string, unknown>) => void
          onError?: (result: Record<string, unknown>) => void
          onClose?: () => void
        }
      ) => void
      hide: () => void
    }
  }
}

interface ReschedulePageProps {
  booking: BookingWithDetails
  availableFlights: FlightWithDetails[]
}

export function ReschedulePage({ booking, availableFlights }: ReschedulePageProps) {
  const router = useRouter()
  const [selectedFlight, setSelectedFlight] = useState<FlightWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [snapReady, setSnapReady] = useState(false)
  const [snapShown, setSnapShown] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rescheduleResult, setRescheduleResult] = useState<RescheduleInitResult | null>(null)

  const priceDiff = selectedFlight
    ? (selectedFlight.price * booking.passenger_count) - booking.total_price
    : 0

  const handleReschedule = useCallback(async () => {
    if (!selectedFlight) return

    setLoading(true)
    try {
      // Step 1: Initiate reschedule
      const initRes = await fetch('/api/reschedule/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          newFlightId: selectedFlight.id,
        }),
      })

      const initData = await initRes.json()

      if (!initRes.ok) {
        throw new Error(initData.error || 'Reschedule gagal')
      }

      const result = initData as RescheduleInitResult
      setRescheduleResult(result)

      if (!result.requires_payment) {
        // No payment needed — done!
        setSuccess(true)
        toast.success('Reschedule berhasil!')
        setTimeout(() => {
          router.push(`/my-bookings/${booking.id}`)
          router.refresh()
        }, 2000)
        return
      }

      // Step 2: Payment needed — get snap token
      const payRes = await fetch('/api/reschedule/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rescheduleId: result.reschedule_id }),
      })

      const payData = await payRes.json()

      if (!payRes.ok) {
        throw new Error(payData.error || 'Gagal membuat pembayaran')
      }

      // Step 3: Show Midtrans Snap
      setSnapShown(true)

      window.snap.embed(payData.snapToken, {
        embedId: 'snap-reschedule-container',
        onSuccess: () => {
          setSuccess(true)
          toast.success('Reschedule berhasil!')
          setTimeout(() => {
            router.push(`/my-bookings/${booking.id}`)
            router.refresh()
          }, 2000)
        },
        onPending: () => {
          toast.info('Menunggu pembayaran...')
        },
        onError: () => {
          toast.error('Pembayaran gagal')
          setSnapShown(false)
          // Expire the reschedule to reverse seat swap
          if (result.reschedule_id) {
            fetch('/api/reschedule/expire', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rescheduleId: result.reschedule_id }),
            })
          }
        },
        onClose: () => {
          setSnapShown(false)
          setLoading(false)
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reschedule gagal'
      toast.error(message)
      setLoading(false)
    }
  }, [selectedFlight, booking.id, booking.passenger_count, router])

  if (success) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-10 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Reschedule Berhasil!</h1>
          <p className="mb-1 font-mono text-sm text-muted-foreground">
            Kode Booking: {booking.booking_code}
          </p>
          <p className="text-sm text-muted-foreground">
            Mengalihkan ke detail pesanan...
          </p>
          <Loader2 className="mt-4 size-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <Script
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js'}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onReady={() => setSnapReady(true)}
        strategy="afterInteractive"
      />

      <PageHeader title="Reschedule Penerbangan" showBack />

      {/* Info banner */}
      <Card className="mt-4 border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 pt-4">
          <CalendarClock className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Ketentuan Reschedule</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-blue-700">
              <li>Rute dan kelas kursi harus sama</li>
              <li>Biaya reschedule: {formatRupiah(RESCHEDULE_FEE)}</li>
              <li>Maksimal {MAX_RESCHEDULES}x reschedule per booking</li>
              <li>Reschedule ke-{booking.reschedule_count + 1} dari {MAX_RESCHEDULES}</li>
              {booking.credit_balance > 0 && (
                <li>Saldo kredit: {formatRupiah(booking.credit_balance)}</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6">
        {/* Current flight */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Penerbangan Saat Ini</h3>
          <FlightSummaryCard flight={booking.flight} />
        </div>

        {!snapShown && (
          <>
            {/* Arrow */}
            <div className="flex justify-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowRight className="size-5 rotate-90 text-primary" />
              </div>
            </div>

            {/* Available flights */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Pilih Penerbangan Baru
                <Badge variant="secondary" className="ml-2">
                  {availableFlights.length} tersedia
                </Badge>
              </h3>

              {availableFlights.length === 0 ? (
                <EmptyState
                  icon={Plane}
                  title="Tidak ada penerbangan tersedia"
                  description="Tidak ada penerbangan lain pada rute dan kelas yang sama"
                />
              ) : (
                <div className="space-y-3">
                  {availableFlights.map((flight) => (
                    <RescheduleFlightCard
                      key={flight.id}
                      flight={flight}
                      currentPrice={booking.total_price}
                      passengerCount={booking.passenger_count}
                      isSelected={selectedFlight?.id === flight.id}
                      onSelect={() => setSelectedFlight(flight)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Summary & confirm */}
            {selectedFlight && (
              <RescheduleSummary
                currentFlight={booking.flight}
                newFlight={selectedFlight}
                passengerCount={booking.passenger_count}
                currentTotal={booking.total_price}
                creditBalance={booking.credit_balance}
                rescheduleResult={rescheduleResult}
              />
            )}

            {selectedFlight && (
              <Button
                onClick={handleReschedule}
                disabled={loading || (priceDiff + RESCHEDULE_FEE - booking.credit_balance > 0 && !snapReady)}
                className="h-12 w-full text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Memproses...
                  </>
                ) : priceDiff + RESCHEDULE_FEE - booking.credit_balance > 0 ? (
                  <>
                    <CalendarClock className="mr-2 size-5" />
                    Reschedule & Bayar {formatRupiah(Math.max(0, priceDiff + RESCHEDULE_FEE - booking.credit_balance))}
                  </>
                ) : (
                  <>
                    <CalendarClock className="mr-2 size-5" />
                    Konfirmasi Reschedule
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* Snap Embedded Container */}
        <Card className={snapShown ? '' : 'hidden'}>
          <CardContent className="p-0">
            <div id="snap-reschedule-container" className="min-h-[500px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
