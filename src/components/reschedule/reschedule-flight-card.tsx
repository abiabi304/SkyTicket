'use client'

import { Badge } from '@/components/ui/badge'
import { cn, formatTime, formatDuration, formatDate, formatRupiah } from '@/lib/utils'
import { RESCHEDULE_FEE } from '@/lib/constants'
import { Check } from 'lucide-react'
import type { FlightWithDetails } from '@/lib/types'

interface RescheduleFlightCardProps {
  flight: FlightWithDetails
  currentPrice: number
  passengerCount: number
  isSelected: boolean
  onSelect: () => void
}

export function RescheduleFlightCard({
  flight,
  currentPrice,
  passengerCount,
  isSelected,
  onSelect,
}: RescheduleFlightCardProps) {
  const newTotal = flight.price * passengerCount
  const priceDiff = newTotal - currentPrice

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-card p-4 text-left transition-all md:p-5',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border md:hover:border-primary/50 md:hover:shadow-sm'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {flight.airline.code}
          </div>
          <div>
            <p className="text-sm font-medium">{flight.airline.name}</p>
            <p className="text-xs text-muted-foreground">{flight.flight_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSelected && (
            <div className="flex size-6 items-center justify-center rounded-full bg-primary">
              <Check className="size-4 text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-lg font-bold">{formatTime(flight.departure_time)}</p>
          <p className="text-xs font-semibold text-primary">{flight.departure_airport.code}</p>
        </div>

        <div className="flex flex-1 flex-col items-center px-3">
          <p className="text-xs text-muted-foreground">{formatDuration(flight.duration_minutes)}</p>
          <div className="relative flex w-full items-center">
            <div className="h-px flex-1 bg-border" />
            <div className="mx-1 text-xs text-primary">✈</div>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold">{formatTime(flight.arrival_time)}</p>
          <p className="text-xs font-semibold text-primary">{flight.arrival_airport.code}</p>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {formatDate(flight.departure_time)}
      </p>

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <div>
          <p className="text-sm font-bold">{formatRupiah(flight.price)}<span className="text-xs font-normal text-muted-foreground">/org</span></p>
          <p className="text-xs text-muted-foreground">{flight.available_seats} kursi tersedia</p>
        </div>
        <div className="text-right">
          {priceDiff > 0 ? (
            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
              +{formatRupiah(priceDiff + RESCHEDULE_FEE)}
            </Badge>
          ) : priceDiff < 0 ? (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
              Kredit {formatRupiah(Math.abs(priceDiff) - RESCHEDULE_FEE)}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              +{formatRupiah(RESCHEDULE_FEE)} (fee)
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}
