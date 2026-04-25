'use client'

import { useState, useMemo } from 'react'
import { FlightCard } from './flight-card'
import { FlightFilter } from './flight-filter'
import { FlightSort } from './flight-sort'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Plane } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { FlightWithDetails, Airline, SortOption, TimeFilter } from '@/lib/types'

interface FlightResultsProps {
  flights: FlightWithDetails[]
  airlines: Airline[]
  passengers: number
  from: string
  to: string
  date: string
  seatClass: string
}

export function FlightResults({
  flights,
  airlines,
  passengers,
  from,
  to,
  date,
  seatClass,
}: FlightResultsProps) {
  const maxPrice = useMemo(() => {
    if (flights.length === 0) return 5000000
    return Math.ceil(Math.max(...flights.map((f) => f.price)) / 100000) * 100000
  }, [flights])

  const [sortBy, setSortBy] = useState<SortOption>('price_asc')
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice])
  const [timeFilter, setTimeFilter] = useState<TimeFilter[]>([])

  const filteredAndSorted = useMemo(() => {
    let result = [...flights]

    // Filter by airline
    if (selectedAirlines.length > 0) {
      result = result.filter((f) => selectedAirlines.includes(f.airline.code))
    }

    // Filter by price
    result = result.filter(
      (f) => f.price >= priceRange[0] && f.price <= priceRange[1]
    )

    // Filter by time of day (using departure hour from ISO string directly — WIB)
    if (timeFilter.length > 0) {
      result = result.filter((f) => {
        // Extract hour from ISO timestamp — parse the time portion directly
        // Flights are stored in WIB (+07:00), so we parse the hour from the string
        const match = f.departure_time.match(/T(\d{2}):/)
        const hour = match ? parseInt(match[1], 10) : new Date(f.departure_time).getHours()
        return timeFilter.some((t) => {
          if (t === 'pagi') return hour >= 6 && hour < 12
          if (t === 'siang') return hour >= 12 && hour < 18
          if (t === 'malam') return hour >= 18 || hour < 6
          return false
        })
      })
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'departure_asc':
        result.sort(
          (a, b) =>
            new Date(a.departure_time).getTime() -
            new Date(b.departure_time).getTime()
        )
        break
      case 'duration_asc':
        result.sort((a, b) => a.duration_minutes - b.duration_minutes)
        break
    }

    return result
  }, [flights, sortBy, selectedAirlines, priceRange, timeFilter])

  // Build subtitle with search context
  const subtitle = [
    date ? formatDate(`${date}T00:00:00`) : null,
    `${passengers} penumpang`,
    seatClass === 'business' ? 'Business' : 'Economy',
  ].filter(Boolean).join(' • ')

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="flex flex-col gap-1">
        <PageHeader
          title={from && to ? `${from} → ${to}` : 'Hasil Pencarian'}
          showBack
        />
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary">
            {filteredAndSorted.length} penerbangan
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {/* Filters */}
        <FlightFilter
          airlines={airlines}
          selectedAirlines={selectedAirlines}
          onAirlinesChange={setSelectedAirlines}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          maxPrice={maxPrice}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
        />

        {/* Results */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-end">
            <FlightSort value={sortBy} onChange={setSortBy} />
          </div>

          {filteredAndSorted.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Tidak ada penerbangan ditemukan"
              description="Coba ubah filter pencarian atau pilih tanggal lain"
              actionLabel="Ubah Pencarian"
              actionHref="/"
            />
          ) : (
            <div className="space-y-3">
              {filteredAndSorted.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  passengers={passengers}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
