'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Airport } from '@/lib/types'

interface AirportFormProps {
  airport?: Airport | null
}

export function AirportForm({ airport }: AirportFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!airport
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState(airport?.code ?? '')
  const [name, setName] = useState(airport?.name ?? '')
  const [city, setCity] = useState(airport?.city ?? '')
  const [country, setCountry] = useState(airport?.country ?? 'Indonesia')

  const handleSubmit = async () => {
    if (!code || !name || !city) { toast.error('Kode, nama, dan kota wajib diisi'); return }

    setLoading(true)
    const payload = { code: code.toUpperCase(), name, city, country }

    let error
    if (isEdit) {
      ({ error } = await supabase.from('airports').update(payload).eq('id', airport.id))
    } else {
      ({ error } = await supabase.from('airports').insert(payload))
    }

    if (error) {
      toast.error(`Gagal ${isEdit ? 'mengubah' : 'menambah'} bandara`)
    } else {
      toast.success(`Bandara berhasil ${isEdit ? 'diubah' : 'ditambahkan'}`)
      router.push('/admin/airports')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Bandara' : 'Tambah Bandara Baru'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Kode Bandara (IATA)</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CGK" maxLength={3} />
          </div>
          <div className="space-y-2">
            <Label>Kota</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nama Bandara</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bandara Internasional Soekarno-Hatta" />
        </div>
        <div className="space-y-2">
          <Label>Negara</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Indonesia" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isEdit ? 'Simpan' : 'Tambah Bandara'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </CardContent>
    </Card>
  )
}
