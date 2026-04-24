'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Airline, Airport, Flight } from '@/lib/types'

interface FlightFormProps {
  airlines: Airline[]
  airports: Airport[]
  flight?: Flight | null
}

function toLocalDatetime(isoString: string): string {
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function FlightForm({ airlines, airports, flight }: FlightFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!flight
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    airline_id: flight?.airline_id ?? '',
    flight_number: flight?.flight_number ?? '',
    departure_airport_id: flight?.departure_airport_id ?? '',
    arrival_airport_id: flight?.arrival_airport_id ?? '',
    departure_time: flight?.departure_time ? toLocalDatetime(flight.departure_time) : '',
    arrival_time: flight?.arrival_time ? toLocalDatetime(flight.arrival_time) : '',
    price: flight?.price?.toString() ?? '',
    seat_class: flight?.seat_class ?? 'economy',
    available_seats: flight?.available_seats?.toString() ?? '100',
  })

  // Auto-calculate duration from departure and arrival times
  const [durationMinutes, setDurationMinutes] = useState(flight?.duration_minutes ?? 0)

  useEffect(() => {
    if (form.departure_time && form.arrival_time) {
      const dep = new Date(form.departure_time).getTime()
      const arr = new Date(form.arrival_time).getTime()
      const diff = Math.round((arr - dep) / 60000)
      setDurationMinutes(diff > 0 ? diff : 0)
    }
  }, [form.departure_time, form.arrival_time])

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.airline_id || !form.flight_number || !form.departure_airport_id || !form.arrival_airport_id || !form.departure_time || !form.arrival_time || !form.price) {
      toast.error('Semua field wajib diisi')
      return
    }

    if (form.departure_airport_id === form.arrival_airport_id) {
      toast.error('Bandara keberangkatan dan tujuan tidak boleh sama')
      return
    }

    const depTime = new Date(form.departure_time)
    const arrTime = new Date(form.arrival_time)

    if (arrTime <= depTime) {
      toast.error('Waktu tiba harus setelah waktu berangkat')
      return
    }

    const price = parseInt(form.price)
    if (!price || price <= 0) {
      toast.error('Harga harus lebih dari 0')
      return
    }

    setLoading(true)
    const payload = {
      airline_id: form.airline_id,
      flight_number: form.flight_number,
      departure_airport_id: form.departure_airport_id,
      arrival_airport_id: form.arrival_airport_id,
      departure_time: depTime.toISOString(),
      arrival_time: arrTime.toISOString(),
      duration_minutes: durationMinutes,
      price,
      seat_class: form.seat_class,
      available_seats: parseInt(form.available_seats) || 100,
    }

    const { error } = isEdit
      ? await supabase.from('flights').update(payload).eq('id', flight.id)
      : await supabase.from('flights').insert(payload)

    if (error) {
      toast.error(`Gagal ${isEdit ? 'mengubah' : 'menambah'} penerbangan`)
      console.error(error)
    } else {
      toast.success(`Penerbangan berhasil ${isEdit ? 'diubah' : 'ditambahkan'}`)
      router.push('/admin/flights')
      router.refresh()
    }
    setLoading(false)
  }

  const formatDurationDisplay = (mins: number) => {
    if (mins <= 0) return '-'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}j ${m}m` : `${m}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Penerbangan' : 'Tambah Penerbangan Baru'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Maskapai</Label>
            <Select value={form.airline_id} onValueChange={(v) => updateField('airline_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih maskapai" /></SelectTrigger>
              <SelectContent>
                {airlines.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nomor Penerbangan</Label>
            <Input value={form.flight_number} onChange={(e) => updateField('flight_number', e.target.value)} placeholder="GA-401" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Bandara Keberangkatan</Label>
            <Select value={form.departure_airport_id} onValueChange={(v) => updateField('departure_airport_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih bandara" /></SelectTrigger>
              <SelectContent>
                {airports.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} — {a.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bandara Tujuan</Label>
            <Select value={form.arrival_airport_id} onValueChange={(v) => updateField('arrival_airport_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih bandara" /></SelectTrigger>
              <SelectContent>
                {airports.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} — {a.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Waktu Berangkat</Label>
            <Input type="datetime-local" value={form.departure_time} onChange={(e) => updateField('departure_time', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Waktu Tiba</Label>
            <Input type="datetime-local" value={form.arrival_time} onChange={(e) => updateField('arrival_time', e.target.value)} />
          </div>
        </div>

        {/* Auto-calculated duration */}
        {durationMinutes > 0 && (
          <div className="rounded-lg bg-muted px-4 py-2 text-sm">
            Durasi penerbangan: <span className="font-semibold">{formatDurationDisplay(durationMinutes)}</span>
            <span className="text-muted-foreground"> (otomatis dihitung)</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Harga per Orang (Rp)</Label>
            <Input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="1250000" min={1} />
          </div>
          <div className="space-y-2">
            <Label>Kursi Tersedia</Label>
            <Input type="number" value={form.available_seats} onChange={(e) => updateField('available_seats', e.target.value)} placeholder="100" min={1} />
          </div>
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={form.seat_class} onValueChange={(v) => updateField('seat_class', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Penerbangan'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </CardContent>
    </Card>
  )
}
