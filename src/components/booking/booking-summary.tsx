'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import type { FlightWithDetails } from '@/lib/types'

interface BookingSummaryProps {
  flight: FlightWithDetails
  passengerCount: number
  totalPrice: number
  onSubmit: () => void
  loading: boolean
}

function SummaryContent({
  flight,
  passengerCount,
  totalPrice,
  onSubmit,
  loading,
}: BookingSummaryProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Penerbangan</p>
        <p className="font-medium">
          {flight.airline.name} {flight.flight_number}
        </p>
        <p className="text-sm text-muted-foreground">
          {flight.departure_airport.code} → {flight.arrival_airport.code}
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Harga tiket</span>
          <span>{formatRupiah(flight.price)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Penumpang</span>
          <span>× {passengerCount}</span>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span className="text-primary">{formatRupiah(totalPrice)}</span>
      </div>

      <Button
        onClick={onSubmit}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Memproses...
          </>
        ) : (
          'Pesan Sekarang'
        )}
      </Button>
    </div>
  )
}

export function BookingSummary(props: BookingSummaryProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop: Sticky sidebar */}
      <div className="hidden w-80 shrink-0 md:block">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryContent {...props} />
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Fixed bottom bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t bg-background p-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="w-full" size="lg">
              {formatRupiah(props.totalPrice)} — Pesan Sekarang
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[70vh]">
            <SheetHeader>
              <SheetTitle>Ringkasan Booking</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <SummaryContent
                {...props}
                onSubmit={() => {
                  setOpen(false)
                  props.onSubmit()
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
