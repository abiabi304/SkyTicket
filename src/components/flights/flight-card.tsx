'use client'

import { useRouter } from 'next/navigation'
import { Clock, Armchair, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRupiah, formatTime, formatDuration, formatDateShort } from '@/lib/utils'
import type { FlightWithDetails } from '@/lib/types'
import { motion } from 'framer-motion'

interface FlightCardProps {
  flight: FlightWithDetails
  passengers: number
}

export function FlightCard({ flight, passengers }: FlightCardProps) {
  const router = useRouter()

  const handleSelect = () => {
    router.push(`/booking/${flight.id}?pax=${passengers}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-lg border bg-card p-4 transition-shadow md:p-6 md:hover:shadow-md"
    >
      {/* Airline info + date */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {flight.airline.code}
        </div>
        <div>
          <p className="text-sm font-medium">{flight.airline.name}</p>
          <p className="text-xs text-muted-foreground">{flight.flight_number}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <CalendarDays className="size-3" />
            {formatDateShort(flight.departure_time)}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {flight.seat_class}
          </Badge>
        </div>
      </div>

      {/* Flight route */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-center">
          <p className="text-xl font-bold md:text-2xl">
            {formatTime(flight.departure_time)}
          </p>
          <p className="text-sm font-semibold text-primary">
            {flight.departure_airport.code}
          </p>
          <p className="text-xs text-muted-foreground">
            {flight.departure_airport.city}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center px-4">
          <p className="mb-1 text-xs text-muted-foreground">
            {formatDuration(flight.duration_minutes)}
          </p>
          <div className="relative flex w-full items-center">
            <div className="h-px flex-1 bg-border" />
            <div className="mx-1 text-primary">✈</div>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Langsung</p>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold md:text-2xl">
            {formatTime(flight.arrival_time)}
          </p>
          <p className="text-sm font-semibold text-primary">
            {flight.arrival_airport.code}
          </p>
          <p className="text-xs text-muted-foreground">
            {flight.arrival_airport.city}
          </p>
        </div>
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDuration(flight.duration_minutes)}
          </span>
          <span className="flex items-center gap-1">
            <Armchair className="size-3.5" />
            {flight.available_seats} kursi
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-primary md:text-xl">
              {formatRupiah(flight.price)}
            </p>
            <p className="text-xs text-muted-foreground">/orang</p>
          </div>
          <Button onClick={handleSelect} size="sm">
            Pilih
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
