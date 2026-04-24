'use client'

import { useRef } from 'react'
import QRCode from 'react-qrcode-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Download, Plane } from 'lucide-react'
import { formatDate, formatTime, formatDuration } from '@/lib/utils'
import type { BookingWithDetails } from '@/lib/types'

interface ETicketProps {
  booking: BookingWithDetails
}

export function ETicket({ booking }: ETicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between no-print">
        <h2 className="text-lg font-bold">E-Ticket</h2>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Download E-Ticket
        </Button>
      </div>

      <Card ref={ticketRef} className="overflow-hidden">
        <div className="bg-primary p-4 text-center text-white">
          <div className="flex items-center justify-center gap-2">
            <Plane className="size-5" />
            <span className="text-lg font-bold">SkyTicket E-Ticket</span>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Booking code + QR */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Kode Booking</p>
              <p className="font-mono text-2xl font-bold text-primary">
                {booking.booking_code}
              </p>
            </div>
            <QRCode
              value={booking.booking_code}
              size={80}
              bgColor="transparent"
              fgColor="#1A73E8"
              qrStyle="dots"
              eyeRadius={4}
            />
          </div>

          <Separator className="mb-6" />

          {/* Flight info */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {booking.flight.airline.code}
              </div>
              <span className="font-medium">{booking.flight.airline.name}</span>
              <span className="text-sm text-muted-foreground">
                {booking.flight.flight_number}
              </span>
            </div>
            <p className="text-sm capitalize text-muted-foreground">
              {booking.flight.seat_class} Class
            </p>
          </div>

          {/* Route */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(booking.flight.departure_time)}</p>
              <p className="font-semibold text-primary">{booking.flight.departure_airport.code}</p>
              <p className="text-sm text-muted-foreground">{booking.flight.departure_airport.city}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(booking.flight.departure_time)}
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center px-4">
              <p className="text-xs text-muted-foreground">
                {formatDuration(booking.flight.duration_minutes)}
              </p>
              <div className="relative flex w-full items-center">
                <div className="h-px flex-1 bg-border" />
                <div className="mx-1 text-primary">✈</div>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(booking.flight.arrival_time)}</p>
              <p className="font-semibold text-primary">{booking.flight.arrival_airport.code}</p>
              <p className="text-sm text-muted-foreground">{booking.flight.arrival_airport.city}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(booking.flight.arrival_time)}
              </p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Passengers */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Penumpang
            </p>
            {booking.passengers.map((p, i) => (
              <div key={p.id} className="mb-2 flex justify-between text-sm">
                <span>
                  {i + 1}. {p.full_name}
                </span>
                <span className="text-muted-foreground">
                  {p.id_type.toUpperCase()}: {p.id_number ?? '-'}
                </span>
              </div>
            ))}
          </div>

          <Separator className="mb-4" />

          {/* Status */}
          <div className="text-center">
            <p className="text-sm font-bold text-green-600">✅ LUNAS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
