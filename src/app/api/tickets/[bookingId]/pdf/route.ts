import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { BookingWithDetails } from '@/lib/types'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp').trim()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}j`
  return `${h}j ${m}m`
}

export async function GET(
  _request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = await createServiceClient()

    const { data: booking } = await serviceClient
      .from('bookings')
      .select(`
        *,
        flight:flights!bookings_flight_id_fkey(
          *,
          airline:airlines(*),
          departure_airport:airports!flights_departure_airport_id_fkey(*),
          arrival_airport:airports!flights_arrival_airport_id_fkey(*)
        ),
        passengers(*),
        payment:payments(*)
      `)
      .eq('id', params.bookingId)
      .eq('user_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const typedBooking = {
      ...booking,
      payment: Array.isArray(booking.payment) ? booking.payment[0] ?? null : booking.payment,
    } as unknown as BookingWithDetails

    if (typedBooking.status !== 'paid') {
      return NextResponse.json({ error: 'Booking belum dibayar' }, { status: 400 })
    }

    const bookingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://skyticket.id'}/my-bookings/${typedBooking.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bookingUrl)}`

    const passengersHtml = typedBooking.passengers.map((p, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:500;">${p.full_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${p.id_type.toUpperCase()}: ${p.id_number ?? '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${p.seat_number ?? '-'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Ticket ${typedBooking.booking_code} - SkyTicket</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 24px; color: #1f2937; }
    .ticket { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 20px 24px; text-align: center; color: #fff; }
    .header h1 { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { font-size: 12px; opacity: 0.85; margin-top: 2px; }
    .body { padding: 24px; }
    .booking-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .booking-code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #1d4ed8; letter-spacing: 2px; }
    .booking-date { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .qr-code { flex-shrink: 0; }
    .qr-code img { width: 100px; height: 100px; }
    .divider { border: none; border-top: 2px dashed #e5e7eb; margin: 20px 0; }
    .airline-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .airline-badge { width: 36px; height: 36px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #1d4ed8; }
    .airline-name { font-weight: 600; font-size: 15px; }
    .airline-detail { font-size: 13px; color: #6b7280; }
    .route { display: flex; align-items: center; justify-content: space-between; background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #f3f4f6; margin-bottom: 20px; }
    .route-point { text-align: center; min-width: 80px; }
    .route-time { font-size: 24px; font-weight: 700; }
    .route-code { font-size: 16px; font-weight: 700; color: #1d4ed8; margin-top: 2px; }
    .route-city { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .route-date { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .route-middle { flex: 1; text-align: center; padding: 0 12px; }
    .route-duration { font-size: 12px; color: #6b7280; }
    .route-line { display: flex; align-items: center; margin: 4px 0; }
    .route-line-bar { flex: 1; height: 1px; background: #d1d5db; }
    .route-line-icon { margin: 0 6px; font-size: 14px; color: #1d4ed8; }
    .route-direct { font-size: 11px; color: #9ca3af; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin-bottom: 10px; }
    .passengers-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .passengers-table th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; border-bottom: 2px solid #e5e7eb; }
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 2px dashed #e5e7eb; }
    .total-label { font-size: 12px; color: #6b7280; }
    .total-amount { font-size: 20px; font-weight: 700; }
    .status-badge { display: inline-block; padding: 6px 16px; border: 2px solid #22c55e; border-radius: 999px; font-size: 13px; font-weight: 700; color: #16a34a; }
    @media print {
      body { background: #fff; padding: 0; }
      .ticket { border: none; border-radius: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>✈ SkyTicket E-Ticket</h1>
      <p>Tunjukkan e-ticket ini saat check-in</p>
    </div>
    <div class="body">
      <div class="booking-info">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px;">Kode Booking</div>
          <div class="booking-code">${typedBooking.booking_code}</div>
          <div class="booking-date">Dipesan pada ${formatDate(typedBooking.created_at)}</div>
        </div>
        <div class="qr-code">
          <img src="${qrUrl}" alt="QR Code" />
        </div>
      </div>

      <hr class="divider" />

      <div class="airline-row">
        <div class="airline-badge">${typedBooking.flight.airline.code}</div>
        <div>
          <div class="airline-name">${typedBooking.flight.airline.name}</div>
          <div class="airline-detail">${typedBooking.flight.flight_number} · ${typedBooking.flight.seat_class === 'business' ? 'Business' : 'Economy'} Class</div>
        </div>
      </div>

      <div class="route">
        <div class="route-point">
          <div class="route-time">${formatTime(typedBooking.flight.departure_time)}</div>
          <div class="route-code">${typedBooking.flight.departure_airport.code}</div>
          <div class="route-city">${typedBooking.flight.departure_airport.city}</div>
          <div class="route-date">${formatDate(typedBooking.flight.departure_time)}</div>
        </div>
        <div class="route-middle">
          <div class="route-duration">${formatDuration(typedBooking.flight.duration_minutes)}</div>
          <div class="route-line">
            <div class="route-line-bar"></div>
            <div class="route-line-icon">✈</div>
            <div class="route-line-bar"></div>
          </div>
          <div class="route-direct">Langsung</div>
        </div>
        <div class="route-point">
          <div class="route-time">${formatTime(typedBooking.flight.arrival_time)}</div>
          <div class="route-code">${typedBooking.flight.arrival_airport.code}</div>
          <div class="route-city">${typedBooking.flight.arrival_airport.city}</div>
          <div class="route-date">${formatDate(typedBooking.flight.arrival_time)}</div>
        </div>
      </div>

      <div class="section-title">Data Penumpang</div>
      <table class="passengers-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Identitas</th>
            <th>Kursi</th>
          </tr>
        </thead>
        <tbody>
          ${passengersHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>
          <div class="total-label">Total Pembayaran</div>
          <div class="total-amount">${formatRupiah(typedBooking.total_price)}</div>
        </div>
        <div class="status-badge">✓ LUNAS</div>
      </div>
    </div>
  </div>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="e-ticket-${typedBooking.booking_code}.html"`,
      },
    })
  } catch (error) {
    console.error('E-ticket PDF error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
