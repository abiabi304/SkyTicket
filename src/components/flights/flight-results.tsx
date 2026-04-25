'use client'

import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { FlightCard } from './flight-card'
import { FlightFilter } from './flight-filter'
import { FlightSort } from './flight-sort'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plane, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { FlightWithDetails, Airline, SortOption, TimeFilter } from '@/lib/types'

const FLIGHTS_PER_PAGE = 10

interface FlightResultsProps {
  flights: FlightWithDetails[]
  airlines: Airline[]
  passengers: number
  from: string
  to: string
  date: string
  month: string
  seatClass: string
}

export function FlightResults({
  flights,
  airlines,
  passengers,
  from,
  to,
  date,
  month,
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
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAndSorted = useMemo(() => {
    let result = [...flights]

    if (selectedAirlines.length > 0) {
      result = result.filter((f) => selectedAirlines.includes(f.airline.code))
    }

    result = result.filter(
      (f) => f.price >= priceRange[0] && f.price <= priceRange[1]
    )

    if (timeFilter.length > 0) {
      result = result.filter((f) => {
        const match = f.departure_time.match(/T(\d{2}):/)
        const hour = match?.[1] ? parseInt(match[1], 10) : new Date(f.departure_time).getHours()
        return timeFilter.some((t) => {
          if (t === 'pagi') return hour >= 6 && hour < 12
          if (t === 'siang') return hour >= 12 && hour < 18
          if (t === 'malam') return hour >= 18 || hour < 6
          return false
        })
      })
    }

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

  const paginatedFlights = useMemo(() => {
    return filteredAndSorted.slice(
      (currentPage - 1) * FLIGHTS_PER_PAGE,
      currentPage * FLIGHTS_PER_PAGE
    )
  }, [filteredAndSorted, currentPage])

  const totalPages = Math.ceil(filteredAndSorted.length / FLIGHTS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy, selectedAirlines, priceRange, timeFilter])

  // Group flights by date for month search
  const isMonthSearch = !date && !!month
  const groupedByDate = useMemo(() => {
    if (!isMonthSearch) return null
    const groups = new Map<string, FlightWithDetails[]>()
    for (const f of paginatedFlights) {
      const dateKey = f.departure_time.split('T')[0] ?? ''
      const existing = groups.get(dateKey)
      if (existing) {
        existing.push(f)
      } else {
        groups.set(dateKey, [f])
      }
    }
    return groups
  }, [paginatedFlights, isMonthSearch])

  // Build subtitle
  const dateLabel = date
    ? formatDate(`${date}T00:00:00`)
    : month
      ? format(new Date(`${month}-01`), 'MMMM yyyy', { locale: idLocale })
      : null

  const subtitle = [
    dateLabel,
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
          <Badge variant="secondary" aria-live="polite">
            {filteredAndSorted.length} penerbangan
          </Badge>
          {isMonthSearch && groupedByDate && (
            <Badge variant="outline">
              {groupedByDate.size} tanggal tersedia
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
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

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-end">
            <FlightSort value={sortBy} onChange={setSortBy} />
          </div>

          {filteredAndSorted.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Tidak ada penerbangan ditemukan"
              description="Coba ubah filter pencarian atau pilih tanggal/bulan lain"
              actionLabel="Ubah Pencarian"
              actionHref="/"
            />
          ) : isMonthSearch && groupedByDate ? (
            // Month search: group by date with date headers
            <div className="space-y-6">
              {Array.from(groupedByDate.entries()).map(([dateKey, dateFlights]) => (
                <div key={dateKey}>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="text-sm font-semibold">
                      {formatDate(`${dateKey}T00:00:00`)}
                    </h3>
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {dateFlights.length} penerbangan
                    </span>
                  </div>
                  <div className="space-y-3">
                    {dateFlights.map((flight) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        passengers={passengers}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Date search: flat list
            <div className="space-y-3">
              {paginatedFlights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  passengers={passengers}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
