'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { formatRupiah } from '@/lib/utils'
import { TIME_FILTERS } from '@/lib/constants'
import type { Airline, TimeFilter } from '@/lib/types'

interface FlightFilterProps {
  airlines: Airline[]
  selectedAirlines: string[]
  onAirlinesChange: (airlines: string[]) => void
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  maxPrice: number
  timeFilter: TimeFilter[]
  onTimeFilterChange: (filters: TimeFilter[]) => void
}

function FilterContent({
  airlines,
  selectedAirlines,
  onAirlinesChange,
  priceRange,
  onPriceRangeChange,
  timeFilter,
  onTimeFilterChange,
  onReset,
  maxPrice,
}: FlightFilterProps & { onReset: () => void }) {
  const toggleAirline = (code: string) => {
    if (selectedAirlines.includes(code)) {
      onAirlinesChange(selectedAirlines.filter((c) => c !== code))
    } else {
      onAirlinesChange([...selectedAirlines, code])
    }
  }

  const toggleTime = (value: TimeFilter) => {
    if (timeFilter.includes(value)) {
      onTimeFilterChange(timeFilter.filter((t) => t !== value))
    } else {
      onTimeFilterChange([...timeFilter, value])
    }
  }

  return (
    <div className="space-y-6">
      {/* Price range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Rentang Harga</h3>
        <Slider
          min={0}
          max={maxPrice}
          step={100000}
          value={[priceRange[0], priceRange[1]]}
          onValueChange={(v) => onPriceRangeChange([v[0]!, v[1]!])}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatRupiah(priceRange[0])}</span>
          <span>{formatRupiah(priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Airlines */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Maskapai</h3>
        <div className="space-y-2">
          {airlines.map((airline) => (
            <label
              key={airline.code}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={selectedAirlines.includes(airline.code)}
                onCheckedChange={() => toggleAirline(airline.code)}
              />
              <span className="text-sm">{airline.name}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Time */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Waktu Berangkat</h3>
        <div className="space-y-2">
          {TIME_FILTERS.map((tf) => (
            <label
              key={tf.value}
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                checked={timeFilter.includes(tf.value as TimeFilter)}
                onCheckedChange={() => toggleTime(tf.value as TimeFilter)}
              />
              <span className="text-sm">{tf.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" onClick={onReset} className="w-full">
        Reset Filter
      </Button>
    </div>
  )
}

export function FlightFilter(props: FlightFilterProps) {
  const [open, setOpen] = useState(false)

  const handleReset = () => {
    props.onAirlinesChange([])
    props.onPriceRangeChange([0, props.maxPrice])
    props.onTimeFilterChange([])
  }

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />
              Filter
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Penerbangan</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent {...props} onReset={handleReset} />
            </div>
            <Button onClick={() => setOpen(false)} className="mt-4 w-full">
              Terapkan Filter
            </Button>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-20 rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Filter</h2>
          <FilterContent {...props} onReset={handleReset} />
        </div>
      </div>
    </>
  )
}
