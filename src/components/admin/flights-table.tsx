'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Airline } from '@/lib/types'

function useFlightParams() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      // Reset to page 1 when filters change (unless we're changing page)
      if (!('page' in updates)) {
        params.delete('page')
      }
      startTransition(() => {
        router.push(`/admin/flights?${params.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )

  return { updateParams, isPending }
}

// --- Search + Filter Bar ---

interface FlightsFilterProps {
  airlines: Airline[]
  search: string
  airline: string
  seatClass: string
}

export function FlightsFilter({
  airlines,
  search,
  airline,
  seatClass,
}: FlightsFilterProps) {
  const { updateParams } = useFlightParams()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nomor penerbangan atau rute..."
          defaultValue={search}
          onChange={(e) => updateParams({ search: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select defaultValue={airline || 'all'} onValueChange={(v) => updateParams({ airline: v === 'all' ? '' : v })}>
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="mr-2 size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Maskapai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Maskapai</SelectItem>
            {airlines.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={seatClass || 'all'} onValueChange={(v) => updateParams({ class: v === 'all' ? '' : v })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            <SelectItem value="economy">Economy</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// --- Pagination Controls ---

interface FlightsPaginationProps {
  totalCount: number
  currentPage: number
  totalPages: number
}

export function FlightsPagination({
  totalCount,
  currentPage,
  totalPages,
}: FlightsPaginationProps) {
  const { updateParams, isPending } = useFlightParams()

  const goToPage = (page: number) => {
    updateParams({ page: page.toString() })
  }

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Halaman {currentPage} dari {totalPages} ({totalCount} penerbangan)
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {getPageNumbers().map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              className="min-w-[36px]"
              onClick={() => goToPage(page)}
              disabled={isPending}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
