import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatRupiah } from '@/lib/utils'
import type { BookingWithDetails } from '@/lib/types'

interface PaymentSummaryProps {
  booking: BookingWithDetails
}

export function PaymentSummary({ booking }: PaymentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Detail Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Kode Booking</p>
          <p className="font-mono text-lg font-bold text-primary">
            {booking.booking_code}
          </p>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-medium">Penumpang</p>
          {booking.passengers.map((p, i) => (
            <p key={p.id} className="text-sm text-muted-foreground">
              {i + 1}. {p.full_name} ({p.id_type.toUpperCase()}: {p.id_number})
            </p>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {booking.flight.airline.name} {booking.flight.flight_number}
            </span>
            <span>{formatRupiah(booking.flight.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Jumlah penumpang</span>
            <span>× {booking.passenger_count}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total Pembayaran</span>
          <span className="text-primary">{formatRupiah(booking.total_price)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
