'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FlightSummaryCard } from './flight-summary-card'
import { PassengerForm } from './passenger-form'
import { ContactForm } from './contact-form'
import { BookingSummary } from './booking-summary'
import { PageHeader } from '@/components/shared/page-header'
import type { FlightWithDetails, PassengerInput, Profile } from '@/lib/types'

interface BookingFlowProps {
  flight: FlightWithDetails
  profile: Profile
  passengerCount: number
}

export function BookingFlow({ flight, profile, passengerCount }: BookingFlowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [passengers, setPassengers] = useState<PassengerInput[]>(
    Array.from({ length: passengerCount }, (_, i) => ({
      full_name: i === 0 ? profile.full_name : '',
      id_type: 'ktp' as const,
      id_number: '',
    }))
  )

  const [contactEmail, setContactEmail] = useState(profile.email)
  const [contactPhone, setContactPhone] = useState(profile.phone ?? '')

  const totalPrice = flight.price * passengerCount

  const validateForm = (): boolean => {
    for (let i = 0; i < passengers.length; i++) {
      if (passengers[i].full_name.length < 3) {
        toast.error(`Nama penumpang ${i + 1} minimal 3 karakter`)
        return false
      }
      if (!passengers[i].id_number) {
        toast.error(`Nomor identitas penumpang ${i + 1} wajib diisi`)
        return false
      }
    }
    if (!contactEmail) {
      toast.error('Email kontak wajib diisi')
      return false
    }
    if (!contactPhone) {
      toast.error('Nomor telepon kontak wajib diisi')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: flight.id,
          passengers,
          contactEmail,
          contactPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Gagal membuat pesanan')
        return
      }

      toast.success('Pesanan berhasil dibuat!')
      router.push(`/payment/${data.bookingId}`)
    } catch {
      toast.error('Gagal membuat pesanan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <PageHeader title="Pesan Penerbangan" showBack />

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="flex-1 space-y-6">
          <FlightSummaryCard flight={flight} />
          <PassengerForm
            passengers={passengers}
            onChange={setPassengers}
          />
          <ContactForm
            email={contactEmail}
            phone={contactPhone}
            onEmailChange={setContactEmail}
            onPhoneChange={setContactPhone}
          />
        </div>

        <BookingSummary
          flight={flight}
          passengerCount={passengerCount}
          totalPrice={totalPrice}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  )
}
