'use client'

import { useMemo } from 'react'
import { cn, formatRupiah } from '@/lib/utils'
import type { SeatLayout, FlightSeat } from '@/lib/types'

interface SeatMapProps {
  layout: SeatLayout
  seats: FlightSeat[]
  selectedSeats: Map<number, string>
  onSeatSelect: (seatLabel: string) => void
  passengerCount: number
  currentPassengerIndex: number
}

type SeatState = 'available' | 'selected-current' | 'selected-other' | 'occupied'

function getSeatState(
  seat: FlightSeat,
  selectedSeats: Map<number, string>,
  currentPassengerIndex: number
): { state: SeatState; passengerNumber: number | null } {
  if (!seat.is_available) {
    return { state: 'occupied', passengerNumber: null }
  }

  const entries = Array.from(selectedSeats.entries())
  for (let i = 0; i < entries.length; i++) {
    const [pIdx, label] = entries[i]!
    if (label === seat.seat_label) {
      if (pIdx === currentPassengerIndex) {
        return { state: 'selected-current', passengerNumber: pIdx + 1 }
      }
      return { state: 'selected-other', passengerNumber: pIdx + 1 }
    }
  }

  return { state: 'available', passengerNumber: null }
}

function getSeatTypeLabel(type: FlightSeat['seat_type']): string {
  switch (type) {
    case 'window': return 'Jendela'
    case 'middle': return 'Tengah'
    case 'aisle': return 'Lorong'
  }
}

export function SeatMap({
  layout,
  seats,
  selectedSeats,
  onSeatSelect,
  currentPassengerIndex,
}: SeatMapProps) {
  const seatMap = useMemo(() => {
    const map = new Map<string, FlightSeat>()
    for (const seat of seats) {
      map.set(seat.seat_label, seat)
    }
    return map
  }, [seats])

  // Build grid template columns: row-number + each column/aisle
  const gridCols = layout.columns
    .map((col) => (col === null ? '1.25rem' : '1fr'))
    .join(' ')

  return (
    <div className="flex flex-col items-center">
      {/* Airplane nose */}
      <div className="relative mb-2 flex w-full justify-center">
        <div
          className="relative overflow-hidden"
          style={{ width: '60%', height: '48px' }}
        >
          <div
            className="absolute inset-x-0 bottom-0 h-[96px] rounded-[50%] border-x border-t border-border bg-gradient-to-b from-muted/60 to-transparent"
          />
        </div>
      </div>

      {/* Fuselage wrapper */}
      <div className="group/seatmap relative w-full rounded-b-3xl border-x border-b border-border bg-gradient-to-b from-muted/30 to-card pb-6">
        {/* Keyboard instructions - visible on focus-within */}
        <p className="hidden group-focus-within/seatmap:block text-xs text-muted-foreground text-center px-3 pt-2">
          Gunakan Tab untuk navigasi antar kursi, Enter atau Spasi untuk memilih
        </p>

        {/* Column headers */}
        <div
          className="sticky top-0 z-10 grid items-center gap-1 bg-card/95 px-3 py-2 backdrop-blur-sm md:px-4"
          style={{
            gridTemplateColumns: `2rem ${gridCols}`,
          }}
        >
          <div />
          {layout.columns.map((col, i) =>
            col === null ? (
              <div key={`aisle-h-${i}`} />
            ) : (
              <div
                key={col}
                className="text-center text-xs font-semibold text-muted-foreground"
              >
                {col}
              </div>
            )
          )}
        </div>

        {/* Seat rows */}
        <div className="space-y-1 px-3 md:px-4" role="grid">
          {layout.rows.map((row) => {
            const isBusiness = row.class === 'business'

            return (
              <div
                key={row.number}
                role="row"
                className={cn(
                  'grid items-center gap-1',
                  isBusiness && 'gap-1.5'
                )}
                style={{
                  gridTemplateColumns: `2rem ${gridCols}`,
                }}
              >
                {/* Row number */}
                <div className="text-center text-xs font-medium text-muted-foreground">
                  {row.number}
                </div>

                {/* Seats */}
                {layout.columns.map((col, colIdx) => {
                  if (col === null) {
                    return <div key={`aisle-${row.number}-${colIdx}`} />
                  }

                  const seatLabel = `${row.number}${col}`
                  const isSkipped = row.skip?.includes(col)

                  if (isSkipped) {
                    return <div key={seatLabel} />
                  }

                  const seat = seatMap.get(seatLabel)
                  if (!seat) {
                    return <div key={seatLabel} />
                  }

                  const { state, passengerNumber } = getSeatState(
                    seat,
                    selectedSeats,
                    currentPassengerIndex
                  )

                  const isDisabled = state === 'occupied' || state === 'selected-other'
                  const hasExtraLegroom = row.extraLegroom

                  return (
                    <button
                      key={seatLabel}
                      type="button"
                      role="gridcell"
                      disabled={isDisabled}
                      onClick={() => onSeatSelect(seatLabel)}
                      aria-label={`Kursi ${seatLabel}, ${getSeatTypeLabel(seat.seat_type)}`}
                      title={`${seatLabel} - ${getSeatTypeLabel(seat.seat_type)}${seat.price_modifier > 0 ? ` (+${formatRupiah(seat.price_modifier)})` : ''}${hasExtraLegroom ? ' - Extra Legroom' : ''}`}
                      className={cn(
                        'group relative flex items-center justify-center rounded-md text-xs font-semibold transition-all duration-150',
                        isBusiness ? 'h-10 md:h-11' : 'h-8 md:h-9',
                        // Extra legroom indicator
                        hasExtraLegroom && 'border-t-2 border-t-emerald-400',
                        // States
                        state === 'available' && [
                          'border border-border bg-card text-foreground shadow-sm',
                          'hover:border-primary hover:bg-primary/5 hover:shadow-md',
                          'active:scale-95',
                        ],
                        state === 'selected-current' && [
                          'border-2 border-primary bg-primary text-primary-foreground shadow-md',
                          'ring-2 ring-primary/20',
                        ],
                        state === 'selected-other' && [
                          'border border-sky-300 bg-sky-100 text-sky-700',
                          'cursor-not-allowed',
                        ],
                        state === 'occupied' && [
                          'border border-transparent bg-muted text-muted-foreground/40',
                          'cursor-not-allowed',
                        ]
                      )}
                    >
                      {state === 'occupied' ? (
                        <span className="text-[10px]">X</span>
                      ) : state === 'selected-current' || state === 'selected-other' ? (
                        <span>{passengerNumber}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary">
                          {col}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <LegendItem
          className="border border-border bg-card shadow-sm"
          label="Tersedia"
        />
        <LegendItem
          className="border-2 border-primary bg-primary"
          label="Dipilih"
          textWhite
        />
        <LegendItem
          className="border border-sky-300 bg-sky-100"
          label="Penumpang Lain"
        />
        <LegendItem
          className="border border-transparent bg-muted"
          label="Terisi"
        />
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-7 rounded-md border border-border bg-card shadow-sm border-t-2 border-t-emerald-400" />
          <span className="text-xs text-muted-foreground">Extra Legroom</span>
        </div>
      </div>
    </div>
  )
}

function LegendItem({
  className,
  label,
  textWhite,
}: {
  className: string
  label: string
  textWhite?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'flex h-5 w-7 items-center justify-center rounded-md text-[9px] font-semibold',
          className,
          textWhite && 'text-primary-foreground'
        )}
      >
        {textWhite ? '1' : ''}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
