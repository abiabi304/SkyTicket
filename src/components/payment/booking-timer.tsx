'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingTimerProps {
  expiresAt: string
  bookingId: string
}

export function BookingTimer({ expiresAt, bookingId }: BookingTimerProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const expiredRef = useRef(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      return Math.max(0, Math.floor(diff / 1000))
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true
        clearInterval(interval)

        // Call server API to atomically expire booking + restore seats
        fetch('/api/bookings/expire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        }).finally(() => {
          router.refresh()
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, bookingId, router])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isUrgent = timeLeft < 300 // less than 5 minutes

  if (timeLeft <= 0) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="font-medium text-destructive">
          Waktu pembayaran telah habis
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Silakan buat booking baru
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 text-center',
        isUrgent
          ? 'border-destructive/50 bg-destructive/10'
          : 'border-yellow-200 bg-yellow-50'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <Clock className={cn('size-4', isUrgent ? 'text-destructive' : 'text-yellow-600')} />
        <p className={cn('text-sm font-medium', isUrgent ? 'text-destructive' : 'text-yellow-800')}>
          Selesaikan pembayaran dalam
        </p>
      </div>
      <p
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums',
          isUrgent ? 'text-destructive' : 'text-yellow-800'
        )}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
    </div>
  )
}
