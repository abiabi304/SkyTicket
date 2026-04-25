'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingCard } from './booking-card'
import { EmptyState } from '@/components/shared/empty-state'

const BOOKINGS_PER_PAGE = 10

type BookingItem = {
  id: string
  booking_code: string
  status: string
  total_price: number
  passenger_count: number
  created_at: string
  flight: {
    flight_number: string
    departure_time: string
    airline: { name: string; code: string; logo_url: string | null }
    departure_airport: { code: string; city: string }
    arrival_airport: { code: string; city: string }
  }
}

interface BookingListProps {
  bookings: BookingItem[]
}

const STATUS_TABS = [
  { value: 'all', label: 'Semua' },
  { value: 'paid', label: 'Lunas' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'expired', label: 'Kedaluwarsa' },
] as const

export function BookingList({ bookings }: BookingListProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesStatus = activeTab === 'all' || booking.status === activeTab
      const matchesSearch =
        !searchQuery ||
        booking.booking_code.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bookings, activeTab, searchQuery])

  const paginatedBookings = useMemo(() => {
    return filteredBookings.slice(
      (currentPage - 1) * BOOKINGS_PER_PAGE,
      currentPage * BOOKINGS_PER_PAGE
    )
  }, [filteredBookings, currentPage])

  const totalPages = Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari kode booking..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak ada pesanan"
            description={
              searchQuery
                ? `Tidak ditemukan pesanan dengan kode "${searchQuery}"`
                : 'Tidak ada pesanan dengan status ini.'
            }
          />
        ) : (
          paginatedBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
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
  )
}
