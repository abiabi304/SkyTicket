'use client'

import QRCode from 'react-qrcode-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Download, Plane } from 'lucide-react'
import { formatDate, formatTime, formatDuration, formatRupiah } from '@/lib/utils'
import type { BookingWithDetails } from '@/lib/types'

interface ETicketProps {
  booking: BookingWithDetails
}

export function ETicket({ booking }: ETicketProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between no-print">
        <h2 className="text-lg font-bold">E-Ticket</h2>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Cetak E-Ticket
        </Button>
      </div>

      {/* This is the only thing that prints */}
      <div id="e-ticket-print">
        <Card className="overflow-hidden border-2">
          {/* Header */}
          <div className="bg-primary p-4 text-center text-white">
            <div className="flex items-center justify-center gap-2">
              <Plane className="size-5" />
              <span className="text-lg font-bold">SkyTicket E-Ticket</span>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Booking code + QR */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Kode Booking</p>
                <p className="font-mono text-3xl font-bold text-primary">
                  {booking.booking_code}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dipesan pada {formatDate(booking.created_at)}
                </p>
              </div>
              <div className="shrink-0">
                <QRCode
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/my-bookings/${booking.id}`}
                  size={90}
                  bgColor="transparent"
                  fgColor="#1A73E8"
                  qrStyle="dots"
                  eyeRadius={4}
                />
              </div>
            </div>

            <Separator className="my-5" />

            {/* Airline info */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {booking.flight.airline.code}
              </div>
              <div>
                <p className="font-semibold">{booking.flight.airline.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.flight.flight_number} • <span className="capitalize">{booking.flight.seat_class}</span> Class
                </p>
              </div>
            </div>

            {/* Route */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatTime(booking.flight.departure_time)}</p>
                  <p className="text-lg font-bold text-primary">{booking.flight.departure_airport.code}</p>
                  <p className="text-sm">{booking.flight.departure_airport.city}</p>
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
                    <div className="mx-2 text-lg text-primary">✈</div>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <p className="text-xs text-muted-foreground">Langsung</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold">{formatTime(booking.flight.arrival_time)}</p>
                  <p className="text-lg font-bold text-primary">{booking.flight.arrival_airport.code}</p>
                  <p className="text-sm">{booking.flight.arrival_airport.city}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(booking.flight.arrival_time)}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Passengers */}
            <div className="mb-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Data Penumpang
              </p>
              <div className="space-y-2">
                {booking.passengers.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="font-medium">{p.full_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.id_type.toUpperCase()}: {p.id_number ?? '-'}
                      {p.seat_number && <> • Kursi {p.seat_number}</>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="mb-5" />

            {/* Footer: price + credit + status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Pembayaran</p>
                <p className="text-lg font-bold">{formatRupiah(booking.total_price)}</p>
                {booking.credit_balance > 0 && (
                  <p className="text-xs text-green-600">
                    Saldo kredit: {formatRupiah(booking.credit_balance)}
                  </p>
                )}
              </div>
              <div className="rounded-full border-2 border-green-500 px-4 py-1.5">
                <p className="text-sm font-bold text-green-600">LUNAS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
