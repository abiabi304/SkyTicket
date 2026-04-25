'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { FlightSummaryCard } from '@/components/booking/flight-summary-card'
import { PageHeader } from '@/components/shared/page-header'
import { BookingTimer } from './booking-timer'
import { PaymentSummary } from './payment-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CreditCard, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { BookingWithDetails } from '@/lib/types'

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
      pay: (
        token: string,
        options: {
          onSuccess?: (result: Record<string, unknown>) => void
          onPending?: (result: Record<string, unknown>) => void
          onError?: (result: Record<string, unknown>) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

interface PaymentPageProps {
  booking: BookingWithDetails
}

export function PaymentPage({ booking }: PaymentPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [snapReady, setSnapReady] = useState(false)
  const [snapError, setSnapError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snapShown, setSnapShown] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Realtime: auto-redirect when booking status changes to 'paid'
  useEffect(() => {
    const channel = supabase
      .channel(`booking-${booking.id}`)
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
            setPaymentSuccess(true)
            toast.success('Pembayaran berhasil!')
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

  const handlePay = useCallback(async () => {
    if (!snapReady) {
      toast.error('Payment gateway sedang dimuat...')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction')
      }

      setSnapShown(true)

      // Hide any existing snap instance to avoid state conflict
      try { window.snap.hide() } catch { /* no-op */ }

      window.snap.embed(data.snapToken, {
        embedId: 'snap-container',
        onSuccess: () => {
          setPaymentSuccess(true)
          toast.success('Pembayaran berhasil!')
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
        },
        onClose: () => {
          setSnapShown(false)
          setLoading(false)
        },
      })
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Gagal memproses pembayaran')
      setLoading(false)
    }
  }, [snapReady, booking.id, router])

  if (paymentSuccess) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-10 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Pembayaran Berhasil!</h1>
          <p className="mb-1 font-mono text-sm text-muted-foreground">
            Kode Booking: {booking.booking_code}
          </p>
          <p className="text-sm text-muted-foreground">
            Mengalihkan ke e-ticket...
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
        onError={() => setSnapError(true)}
        strategy="afterInteractive"
      />

      <PageHeader title="Pembayaran" showBack />

      {booking.expires_at && (
        <div className="mt-4">
          <BookingTimer
            expiresAt={booking.expires_at}
            bookingId={booking.id}
          />
        </div>
      )}

      <div className="mt-6 space-y-6">
        {!snapShown && (
          <>
            <FlightSummaryCard flight={booking.flight} />
            <PaymentSummary booking={booking} />

            {snapError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="text-sm font-medium text-destructive">
                  Gagal memuat payment gateway
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <Button
                onClick={handlePay}
                disabled={loading || !snapReady || booking.status !== 'pending'}
                className="h-12 w-full text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Memproses...
                  </>
                ) : !snapReady ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Memuat gateway...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 size-5" />
                    Pilih Metode Pembayaran — {formatRupiah(booking.total_price)}
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {/* Snap Embedded Container */}
        <Card className={snapShown ? '' : 'hidden'}>
          <CardContent className="p-0">
            <div id="snap-container" className="min-h-[500px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
