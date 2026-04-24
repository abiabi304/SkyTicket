'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowRightLeft, CalendarIcon, Minus, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSearchStore } from '@/store/search-store'
import { AirportSelector } from './airport-selector'
import { SEAT_CLASSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Airport } from '@/lib/types'
import type { SeatClass } from '@/lib/types'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface SearchFormProps {
  airports: Airport[]
}

export function SearchForm({ airports }: SearchFormProps) {
  const router = useRouter()
  const {
    from,
    to,
    departureDate,
    passengers,
    seatClass,
    setFrom,
    setTo,
    swapAirports,
    setDepartureDate,
    setPassengers,
    setSeatClass,
  } = useSearchStore()

  const handleSubmit = () => {
    if (!from) {
      toast.error('Pilih bandara keberangkatan')
      return
    }
    if (!to) {
      toast.error('Pilih bandara tujuan')
      return
    }
    if (from === to) {
      toast.error('Bandara keberangkatan dan tujuan tidak boleh sama')
      return
    }

    const dateStr = format(departureDate, 'yyyy-MM-dd')
    router.push(
      `/flights?from=${from}&to=${to}&date=${dateStr}&pax=${passengers}&class=${seatClass}`
    )
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-4 shadow-lg md:p-6">
      {/* Airport selectors */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:gap-2">
        <AirportSelector
          airports={airports}
          value={from}
          onSelect={setFrom}
          placeholder="Pilih bandara asal"
          label="Dari"
        />

        <motion.div whileTap={{ scale: 0.9 }} className="flex items-end justify-center md:pb-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={swapAirports}
            className="size-10 shrink-0 rounded-full"
          >
            <ArrowRightLeft className="size-4" />
            <span className="sr-only">Tukar bandara</span>
          </Button>
        </motion.div>

        <AirportSelector
          airports={airports}
          value={to}
          onSelect={setTo}
          placeholder="Pilih bandara tujuan"
          label="Ke"
        />
      </div>

      {/* Date, passengers, class */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Date picker */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Tanggal Berangkat
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-11 w-full justify-start text-left font-normal md:h-12',
                  !departureDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {departureDate
                  ? format(departureDate, 'd MMMM yyyy', { locale: id })
                  : 'Pilih tanggal'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={departureDate}
                onSelect={(date) => date && setDepartureDate(date)}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Passenger counter */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Penumpang
          </label>
          <div className="flex h-11 items-center rounded-lg border px-3 md:h-12">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPassengers(passengers - 1)}
              disabled={passengers <= 1}
            >
              <Minus className="size-4" />
            </Button>
            <span className="flex-1 text-center font-medium">
              {passengers} Orang
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setPassengers(passengers + 1)}
              disabled={passengers >= 5}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {/* Class select */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Kelas
          </label>
          <Select value={seatClass} onValueChange={(v) => setSeatClass(v as SeatClass)}>
            <SelectTrigger className="h-11 md:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEAT_CLASSES.map((cls) => (
                <SelectItem key={cls.value} value={cls.value}>
                  {cls.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} className="h-11 w-full text-base md:h-12" size="lg">
        <Search className="mr-2 size-5" />
        Cari Penerbangan
      </Button>
    </div>
  )
}
