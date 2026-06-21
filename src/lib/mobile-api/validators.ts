import type { SeatClass, SortOption, TimeFilter } from '@/lib/types'

export function isValidIndonesianPhone(value: string) {
  const cleaned = value.replace(/[\s\-()]/g, '')
  return /^(\+62|62|0)8\d{7,12}$/.test(cleaned)
}

export function parsePassengerCount(value: string | null) {
  const count = Number(value ?? '1')
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    throw new Error('Jumlah penumpang harus 1 sampai 5')
  }
  return count
}

export function parseSeatClass(value: string | null): SeatClass {
  if (value !== 'economy' && value !== 'business') {
    throw new Error('Seat class tidak valid')
  }
  return value
}

export function parseSortOption(value: string | null): SortOption {
  if (value === 'price_asc' || value === 'price_desc' || value === 'departure_asc' || value === 'duration_asc') {
    return value
  }
  return 'departure_asc'
}

export function parseTimeFilters(value: string | null): TimeFilter[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is TimeFilter => item === 'pagi' || item === 'siang' || item === 'malam')
}

export function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value ?? fallback)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

export function parseMaxPrice(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Harga maksimal tidak valid')
  }
  return parsed
}
