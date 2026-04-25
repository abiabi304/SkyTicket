import { Badge } from '@/components/ui/badge'
import { formatTime, formatDuration, formatDate } from '@/lib/utils'
import { getAirlineLogoUrl } from '@/lib/supabase/storage'
import type { FlightWithDetails } from '@/lib/types'

interface FlightSummaryCardProps {
  flight: FlightWithDetails
}

export function FlightSummaryCard({ flight }: FlightSummaryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 md:p-6">
      <div className="mb-3 flex items-center gap-3">
        {flight.airline.logo_url ? (
          <img src={getAirlineLogoUrl(flight.airline.logo_url)!} alt={flight.airline.name} className="size-8 rounded-full object-cover" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {flight.airline.code}
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{flight.airline.name}</p>
          <p className="text-xs text-muted-foreground">{flight.flight_number}</p>
        </div>
        <Badge variant="secondary" className="ml-auto capitalize">
          {flight.seat_class}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-lg font-bold">{formatTime(flight.departure_time)}</p>
          <p className="text-sm font-semibold text-primary">{flight.departure_airport.code}</p>
          <p className="text-xs text-muted-foreground">{flight.departure_airport.city}</p>
        </div>

        <div className="flex flex-1 flex-col items-center px-4">
          <p className="text-xs text-muted-foreground">{formatDuration(flight.duration_minutes)}</p>
          <div className="relative flex w-full items-center">
            <div className="h-px flex-1 bg-border" />
            <div className="mx-1 text-primary">✈</div>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold">{formatTime(flight.arrival_time)}</p>
          <p className="text-sm font-semibold text-primary">{flight.arrival_airport.code}</p>
          <p className="text-xs text-muted-foreground">{flight.arrival_airport.city}</p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {formatDate(flight.departure_time)}
      </p>
    </div>
  )
}
