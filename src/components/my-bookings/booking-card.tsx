'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatDate, formatTime, getBookingStatusColor, getBookingStatusLabel } from '@/lib/utils'
import { motion } from 'framer-motion'

interface BookingCardProps {
  booking: {
    id: string
    booking_code: string
    status: string
    total_price: number
    passenger_count: number
    created_at: string
    flight: {
      flight_number: string
      departure_time: string
      airline: { name: string; code: string }
      departure_airport: { code: string; city: string }
      arrival_airport: { code: string; city: string }
    }
  }
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        href={booking.status === 'pending' ? `/payment/${booking.id}` : `/my-bookings/${booking.id}`}
        className="group block rounded-lg border bg-card p-4 transition-shadow md:p-5 md:hover:shadow-md"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Kode Booking</p>
            <p className="font-mono text-sm font-bold">{booking.booking_code}</p>
          </div>
          <Badge
            variant="outline"
            className={getBookingStatusColor(booking.status)}
          >
            {getBookingStatusLabel(booking.status)}
          </Badge>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold">
            {booking.flight.departure_airport.code}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-sm font-semibold">
            {booking.flight.arrival_airport.code}
          </span>
          <span className="text-xs text-muted-foreground">
            ({booking.flight.departure_airport.city} → {booking.flight.arrival_airport.city})
          </span>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {formatDate(booking.flight.departure_time)} • {formatTime(booking.flight.departure_time)}
        </p>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {booking.passenger_count} Penumpang • {formatRupiah(booking.total_price)}
          </p>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </motion.div>
  )
}
