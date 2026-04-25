'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Armchair, Shuffle, Check } from 'lucide-react'
import { cn, formatRupiah } from '@/lib/utils'
import { SeatMap } from './seat-map'
import type { SeatLayout, FlightSeat, PassengerInput } from '@/lib/types'

interface SeatSelectionProps {
  layout: SeatLayout
  seats: FlightSeat[]
  passengers: PassengerInput[]
  selectedSeats: Map<number, string>
  onSeatsChange: (seats: Map<number, string>) => void
  basePrice: number
}

export function SeatSelection({
  layout,
  seats,
  passengers,
  selectedSeats,
  onSeatsChange,
}: SeatSelectionProps) {
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0)

  const seatMap = useMemo(() => {
    const map = new Map<string, FlightSeat>()
    for (const seat of seats) {
      map.set(seat.seat_label, seat)
    }
    return map
  }, [seats])

  const handleSeatSelect = useCallback(
    (seatLabel: string) => {
      const next = new Map(selectedSeats)

      // If this seat is already selected by current passenger, deselect it
      if (selectedSeats.get(currentPassengerIndex) === seatLabel) {
        next.delete(currentPassengerIndex)
        onSeatsChange(next)
        return
      }

      // Assign seat to current passenger
      next.set(currentPassengerIndex, seatLabel)
      onSeatsChange(next)

      // Auto-advance to next passenger without a seat
      const nextUnseated = findNextUnseated(
        currentPassengerIndex,
        passengers.length,
        next
      )
      if (nextUnseated !== null) {
        setCurrentPassengerIndex(nextUnseated)
      }
    },
    [selectedSeats, currentPassengerIndex, passengers.length, onSeatsChange]
  )

  const handleRandomAssign = useCallback(() => {
    const selectedLabels = Array.from(selectedSeats.values())
    const available = seats.filter((s) => {
      if (!s.is_available) return false
      return !selectedLabels.includes(s.seat_label)
    })

    const next = new Map(selectedSeats)
    let availIdx = 0

    for (let i = 0; i < passengers.length; i++) {
      if (!next.has(i) && availIdx < available.length) {
        next.set(i, available[availIdx].seat_label)
        availIdx++
      }
    }

    onSeatsChange(next)
  }, [seats, selectedSeats, passengers.length, onSeatsChange])

  const totalModifier = useMemo(() => {
    let total = 0
    const labels = Array.from(selectedSeats.values())
    for (let i = 0; i < labels.length; i++) {
      const seat = seatMap.get(labels[i])
      if (seat) total += seat.price_modifier
    }
    return total
  }, [selectedSeats, seatMap])

  function getSeatTypeLabel(type: FlightSeat['seat_type']): string {
    switch (type) {
      case 'window': return 'Jendela'
      case 'middle': return 'Tengah'
      case 'aisle': return 'Lorong'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Armchair className="size-5" />
          Pilih Kursi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Passenger tabs */}
        <div className="flex flex-wrap gap-2">
          {passengers.map((p, i) => {
            const hasSelection = selectedSeats.has(i)
            const isActive = i === currentPassengerIndex

            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentPassengerIndex(i)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50',
                  hasSelection && !isActive && 'border-emerald-200 bg-emerald-50/50'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-bold',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : hasSelection
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {hasSelection && !isActive ? (
                    <Check className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden sm:inline">
                  {p.full_name || `Penumpang ${i + 1}`}
                </span>
                <span className="sm:hidden">P{i + 1}</span>
              </button>
            )
          })}
        </div>

        {/* Seat map with horizontal scroll on mobile */}
        <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3 md:p-5">
          <div className="mx-auto min-w-[320px] max-w-[420px]">
            <SeatMap
              layout={layout}
              seats={seats}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
              passengerCount={passengers.length}
              currentPassengerIndex={currentPassengerIndex}
            />
          </div>
        </div>

        {/* Selected seats summary */}
        <div className="space-y-2">
          {passengers.map((p, i) => {
            const label = selectedSeats.get(i)
            const seat = label ? seatMap.get(label) : null

            return (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                  label
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                      label
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="font-medium">
                    {p.full_name || `Penumpang ${i + 1}`}
                  </span>
                </div>
                <div className="text-right">
                  {seat ? (
                    <div>
                      <span className="font-semibold text-primary">
                        Kursi {label}
                      </span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({getSeatTypeLabel(seat.seat_type)})
                      </span>
                      {seat.price_modifier > 0 && (
                        <span className="ml-1.5 text-xs font-medium text-emerald-600">
                          +{formatRupiah(seat.price_modifier)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Belum dipilih</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Total modifier + skip button */}
        {totalModifier > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Biaya tambahan kursi</span>
              <span className="font-semibold text-primary">
                +{formatRupiah(totalModifier)}
              </span>
            </div>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomAssign}
          className="w-full"
        >
          <Shuffle className="mr-2 size-4" />
          Lewati Pemilihan Kursi
        </Button>
      </CardContent>
    </Card>
  )
}

function findNextUnseated(
  current: number,
  total: number,
  selected: Map<number, string>
): number | null {
  for (let offset = 1; offset < total; offset++) {
    const idx = (current + offset) % total
    if (!selected.has(idx)) return idx
  }
  return null
}
