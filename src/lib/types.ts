export interface Airport {
  id: string
  code: string
  name: string
  city: string
  country: string
  created_at: string
}

export interface Airline {
  id: string
  code: string
  name: string
  logo_url: string | null
  created_at: string
}

export interface Flight {
  id: string
  airline_id: string
  flight_number: string
  departure_airport_id: string
  arrival_airport_id: string
  departure_time: string
  arrival_time: string
  duration_minutes: number
  price: number
  seat_class: SeatClass
  available_seats: number
  created_at: string
}

export interface FlightWithDetails extends Flight {
  airline: Airline
  departure_airport: Airport
  arrival_airport: Airport
}

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type UserRole = 'user' | 'admin'

export interface Booking {
  id: string
  user_id: string
  flight_id: string
  booking_code: string
  status: BookingStatus
  total_price: number
  passenger_count: number
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface BookingWithDetails extends Booking {
  flight: FlightWithDetails
  passengers: Passenger[]
  payment: Payment | null
}

export interface Passenger {
  id: string
  booking_id: string
  full_name: string
  id_number: string | null
  id_type: 'ktp' | 'paspor'
  seat_number: string | null
  created_at: string
}

export interface PassengerInput {
  full_name: string
  id_type: 'ktp' | 'paspor'
  id_number: string
}

export interface Payment {
  id: string
  booking_id: string
  midtrans_order_id: string
  midtrans_transaction_id: string | null
  payment_type: string | null
  gross_amount: number
  status: PaymentStatus
  snap_token: string | null
  snap_redirect_url: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'expired'
export type PaymentStatus = 'pending' | 'settlement' | 'capture' | 'deny' | 'cancel' | 'expire' | 'failure'
export type SeatClass = 'economy' | 'business'


export type TimeFilter = 'pagi' | 'siang' | 'malam'
export type SortOption = 'price_asc' | 'price_desc' | 'departure_asc' | 'duration_asc'
