import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp').trim()
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: id })
}

export function formatDateShort(date: string): string {
  return format(parseISO(date), 'd MMM yyyy', { locale: id })
}

export function formatTime(date: string): string {
  return format(parseISO(date), 'HH:mm')
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}j`
  return `${hours}j ${mins}m`
}

export function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function getFlightStatus(departureTime: string, arrivalTime: string): 'upcoming' | 'departed' | 'completed' {
  const now = new Date()
  const departure = parseISO(departureTime)
  const arrival = parseISO(arrivalTime)

  if (isBefore(now, departure)) return 'upcoming'
  if (isAfter(now, arrival)) return 'completed'
  return 'departed'
}

export function getTimeUntil(date: string): string {
  return formatDistanceToNow(parseISO(date), { locale: id, addSuffix: true })
}

export function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'expired':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

export function getBookingStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Lunas'
    case 'pending':
      return 'Menunggu Pembayaran'
    case 'cancelled':
      return 'Dibatalkan'
    case 'expired':
      return 'Kedaluwarsa'
    default:
      return status
  }
}
