'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import { RESCHEDULE_FEE, MAX_RESCHEDULES, MIDTRANS_SNAP_JS_URL } from '@/lib/constants'
import type { BookingWithDetails, FlightWithDetails, RescheduleInitResult } from '@/lib/types'

interface ReschedulePageProps {
  booking: BookingWithDetails
  availableFlights: FlightWithDetails[]
}

export function ReschedulePage({ booking, availableFlights }: ReschedulePageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedFlight, setSelectedFlight] = useState<FlightWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [snapReady, setSnapReady] = useState(false)
  const [snapShown, setSnapShown] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rescheduleResult, setRescheduleResult] = useState<RescheduleInitResult | null>(null)
  const processingRef = useRef(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  const priceDiff = selectedFlight
    ? (selectedFlight.price * booking.passenger_count) - booking.total_price
    : 0

  const amountDue = selectedFlight
    ? Math.max(0, priceDiff + RESCHEDULE_FEE - booking.credit_balance)
    : 0

  // Realtime: auto-redirect when booking status changes to 'paid' (after webhook)
  useEffect(() => {
    const channel = supabase
      .channel(`reschedule-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status
          if (newStatus === 'paid') {
            setSuccess(true)
            toast.success('Reschedule berhasil!')
            setTimeout(() => {
              router.push(`/my-bookings/${booking.id}`)
            }, 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [booking.id, supabase, router])

  const handleSelectFlight = (flight: FlightWithDetails) => {
    setSelectedFlight(flight)
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const handleReschedule = useCallback(async () => {
    if (!selectedFlight || processingRef.current) return
    processingRef.current = true

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
        setSuccess(true)
        const creditGained = result.price_difference < 0
          ? Math.abs(result.price_difference) - result.reschedule_fee
          : 0
        if (creditGained > 0) {
          toast.success(`Reschedule berhasil! Anda mendapat kredit ${formatRupiah(creditGained)} untuk reschedule berikutnya.`, { duration: 5000 })
        } else {
          toast.success('Reschedule berhasil!')
        }
        setTimeout(() => {
          router.push(`/my-bookings/${booking.id}`)
          router.refresh()
        }, 2500)
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

      // Step 3: Show Midtrans Snap embedded (same as booking payment)
      setSnapShown(true)

      try { window.snap.hide() } catch { /* no-op */ }

      window.snap.embed(payData.snapToken, {
        embedId: 'snap-reschedule-container',
        onSuccess: () => {
          setSuccess(true)
          toast.success('Reschedule berhasil!')
          setTimeout(() => {
            router.push(`/my-bookings/${booking.id}`)
          }, 2000)
        },
        onPending: () => {
          toast.info('Menunggu pembayaran...')
        },
        onError: () => {
          toast.error('Pembayaran gagal')
          setSnapShown(false)
          if (result.reschedule_id) {
            fetch('/api/reschedule/expire', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ rescheduleId: result.reschedule_id }),
            })
          }
          setLoading(false)
          processingRef.current = false
        },
        onClose: () => {
          setSnapShown(false)
          setLoading(false)
          processingRef.current = false
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reschedule gagal'
      toast.error(message)
      setLoading(false)
      processingRef.current = false
    }
  }, [selectedFlight, booking.id, router])

  if (success) {
    const creditGained = rescheduleResult && rescheduleResult.price_difference < 0
      ? Math.abs(rescheduleResult.price_difference) - rescheduleResult.reschedule_fee
      : 0

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
          {creditGained > 0 && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2">
              <p className="text-sm font-medium text-green-700">
                Anda mendapat kredit {formatRupiah(creditGained)}
              </p>
              <p className="text-xs text-green-600">
                Kredit otomatis digunakan saat reschedule berikutnya
              </p>
            </div>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Mengalihkan ke detail pesanan...
          </p>
          <Loader2 className="mt-4 size-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-32 md:px-6 md:pb-6">
      <Script
        src={MIDTRANS_SNAP_JS_URL}
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
                      onSelect={() => handleSelectFlight(flight)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Summary (scroll target) */}
            {selectedFlight && (
              <div ref={summaryRef}>
                <RescheduleSummary
                  currentFlight={booking.flight}
                  newFlight={selectedFlight}
                  passengerCount={booking.passenger_count}
                  currentTotal={booking.total_price}
                  creditBalance={booking.credit_balance}
                  rescheduleResult={rescheduleResult}
                />
              </div>
            )}

            {/* Desktop confirm button */}
            {selectedFlight && (
              <div className="hidden md:block">
                <Button
                  onClick={handleReschedule}
                  disabled={loading || (amountDue > 0 && !snapReady)}
                  className="h-12 w-full text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      Memproses...
                    </>
                  ) : amountDue > 0 ? (
                    <>
                      <CalendarClock className="mr-2 size-5" />
                      Reschedule & Bayar {formatRupiah(amountDue)}
                    </>
                  ) : (
                    <>
                      <CalendarClock className="mr-2 size-5" />
                      Konfirmasi Reschedule
                    </>
                  )}
                </Button>
              </div>
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

      {/* Mobile sticky bottom bar — only show when not in payment */}
      {selectedFlight && !snapShown && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg md:hidden">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedFlight.airline.code} {selectedFlight.flight_number}
              </span>
              <span className="font-bold">
                {amountDue > 0 ? formatRupiah(amountDue) : 'Gratis'}
              </span>
            </div>
            <Button
              onClick={handleReschedule}
              disabled={loading || (amountDue > 0 && !snapReady)}
              className="h-12 w-full text-base"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Memproses...
                </>
              ) : amountDue > 0 ? (
                <>
                  <CalendarClock className="mr-2 size-5" />
                  Reschedule & Bayar
                </>
              ) : (
                <>
                  <CalendarClock className="mr-2 size-5" />
                  Konfirmasi Reschedule
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
