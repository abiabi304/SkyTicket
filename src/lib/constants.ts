export const SEAT_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'business', label: 'Business' },
] as const

export const BOOKING_STATUSES = {
  pending: 'Menunggu Pembayaran',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
  rescheduling: 'Proses Reschedule',
} as const

export const PAYMENT_STATUSES = {
  pending: 'Menunggu',
  settlement: 'Berhasil',
  capture: 'Berhasil',
  deny: 'Ditolak',
  cancel: 'Dibatalkan',
  expire: 'Kedaluwarsa',
  failure: 'Gagal',
} as const

export const BOOKING_EXPIRY_MINUTES = 15
export const RESCHEDULE_EXPIRY_MINUTES = 30
export const RESCHEDULE_FEE = 50000
export const MAX_RESCHEDULES = 2
export const MIN_RESCHEDULE_HOURS_BEFORE_DEPARTURE = 24

export const TIME_FILTERS = [
  { value: 'pagi', label: 'Pagi (06:00 - 12:00)', startHour: 6, endHour: 12 },
  { value: 'siang', label: 'Siang (12:00 - 18:00)', startHour: 12, endHour: 18 },
  { value: 'malam', label: 'Malam (18:00 - 06:00)', startHour: 18, endHour: 6 },
] as const

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'departure_asc', label: 'Berangkat Paling Awal' },
  { value: 'duration_asc', label: 'Durasi Tercepat' },
] as const

// Midtrans Snap JS URL (client-safe, uses NEXT_PUBLIC_ env var)
export const MIDTRANS_SNAP_JS_URL =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'

// WhatsApp CS
export const CS_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_CS_WHATSAPP_NUMBER || '6281234567890'
export const CS_WHATSAPP_MESSAGE = 'Halo SkyTicket, saya butuh bantuan.'
