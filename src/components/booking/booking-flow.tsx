'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FlightSummaryCard } from './flight-summary-card'
import { PassengerForm } from './passenger-form'
import { ContactForm } from './contact-form'
import { BookingSummary } from './booking-summary'
import { PageHeader } from '@/components/shared/page-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatTime, formatDate } from '@/lib/utils'
import type { FlightWithDetails, PassengerInput, Profile } from '@/lib/types'

interface BookingFlowProps {
  flight: FlightWithDetails
  profile: Profile
  passengerCount: number
}

export function BookingFlow({ flight, profile, passengerCount }: BookingFlowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

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

  const handleConfirmClick = () => {
    if (!validateForm()) return
    setShowConfirmation(true)
  }

  const handleSubmit = async () => {
    setShowConfirmation(false)
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
          onSubmit={handleConfirmClick}
          loading={loading}
        />
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pesanan</DialogTitle>
            <DialogDescription>
              Periksa kembali detail pesanan Anda sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Penerbangan</p>
              <p className="font-semibold">
                {flight.airline.name} ({flight.flight_number})
              </p>
              <p className="text-sm">
                {flight.departure_airport.city} ({flight.departure_airport.code}) → {flight.arrival_airport.city} ({flight.arrival_airport.code})
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(flight.departure_time)} • {formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Penumpang</p>
              <ul className="mt-1 space-y-1">
                {passengers.map((p, i) => (
                  <li key={i} className="text-sm">
                    {i + 1}. {p.full_name}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Kontak</p>
              <p className="text-sm">{contactEmail}</p>
              <p className="text-sm">{contactPhone}</p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium">Total Harga</span>
              <span className="text-lg font-bold text-primary">
                {formatRupiah(totalPrice)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Kembali
            </Button>
            <Button onClick={handleSubmit}>
              Konfirmasi &amp; Pesan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
