import type { FlightSeat } from '@/lib/types'

/**
 * Shared seat utilities — extracted from seat-map.tsx and seat-selection.tsx
 */

export type SeatTypeLabel = 'Jendela' | 'Tengah' | 'Lorong'

export function getSeatTypeLabel(type: string): SeatTypeLabel {
  switch (type) {
    case 'window': return 'Jendela'
    case 'middle': return 'Tengah'
    case 'aisle': return 'Lorong'
    default: return 'Lorong'
  }
}

export function buildSeatMap(seats: FlightSeat[]): Map<string, FlightSeat> {
  return new Map(seats.map(s => [s.seat_label, s]))
}

export function calculateSeatModifierTotal(
  seats: FlightSeat[],
  selectedSeats: Map<number, string>
): number {
  const seatMap = buildSeatMap(seats)
  let total = 0
  selectedSeats.forEach((label) => {
    const seat = seatMap.get(label)
    if (seat) total += seat.price_modifier
  })
  return total
}
