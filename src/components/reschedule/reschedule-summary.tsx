import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatTime, formatDate } from '@/lib/utils'
import { RESCHEDULE_FEE } from '@/lib/constants'
import type { FlightWithDetails, RescheduleInitResult } from '@/lib/types'

interface RescheduleSummaryProps {
  currentFlight: FlightWithDetails
  newFlight: FlightWithDetails
  passengerCount: number
  currentTotal: number
  creditBalance: number
  rescheduleResult: RescheduleInitResult | null
}

export function RescheduleSummary({
  currentFlight,
  newFlight,
  passengerCount,
  currentTotal,
  creditBalance,
}: RescheduleSummaryProps) {
  const newTotal = newFlight.price * passengerCount
  const priceDiff = newTotal - currentTotal
  const amountDue = Math.max(0, priceDiff + RESCHEDULE_FEE - creditBalance)
  const creditGained = priceDiff < 0 ? Math.abs(priceDiff) - RESCHEDULE_FEE : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ringkasan Reschedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current → New */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Saat Ini</p>
            <p className="font-medium">{currentFlight.flight_number}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(currentFlight.departure_time)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(currentFlight.departure_time)} - {formatTime(currentFlight.arrival_time)}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Penerbangan Baru</p>
            <p className="font-medium">{newFlight.flight_number}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(newFlight.departure_time)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(newFlight.departure_time)} - {formatTime(newFlight.arrival_time)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Harga saat ini ({passengerCount} pax)</span>
            <span>{formatRupiah(currentTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Harga baru ({passengerCount} pax)</span>
            <span>{formatRupiah(newTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Selisih harga</span>
            <span className={priceDiff > 0 ? 'text-orange-600' : priceDiff < 0 ? 'text-green-600' : ''}>
              {priceDiff > 0 ? '+' : ''}{formatRupiah(priceDiff)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Biaya reschedule</span>
            <span>{formatRupiah(RESCHEDULE_FEE)}</span>
          </div>
          {creditBalance > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo kredit</span>
              <span className="text-green-600">-{formatRupiah(creditBalance)}</span>
            </div>
          )}

          <Separator />

          {amountDue > 0 ? (
            <div className="flex justify-between font-bold">
              <span>Total Bayar</span>
              <span className="text-primary">{formatRupiah(amountDue)}</span>
            </div>
          ) : creditGained > 0 ? (
            <div className="flex justify-between font-bold">
              <span>Kredit Diterima</span>
              <span className="text-green-600">{formatRupiah(creditGained)}</span>
            </div>
          ) : (
            <div className="flex justify-between font-bold">
              <span>Total Bayar</span>
              <span className="text-green-600">Gratis</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
