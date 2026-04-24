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
import type { Airline } from '@/lib/types'

interface AirlineFormProps {
  airline?: Airline | null
}

export function AirlineForm({ airline }: AirlineFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!airline
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState(airline?.code ?? '')
  const [name, setName] = useState(airline?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(airline?.logo_url ?? '')

  const handleSubmit = async () => {
    if (!code || !name) { toast.error('Kode dan nama wajib diisi'); return }

    setLoading(true)
    const payload = { code: code.toUpperCase(), name, logo_url: logoUrl || null }

    let error
    if (isEdit) {
      ({ error } = await supabase.from('airlines').update(payload).eq('id', airline.id))
    } else {
      ({ error } = await supabase.from('airlines').insert(payload))
    }

    if (error) {
      toast.error(`Gagal ${isEdit ? 'mengubah' : 'menambah'} maskapai`)
    } else {
      toast.success(`Maskapai berhasil ${isEdit ? 'diubah' : 'ditambahkan'}`)
      router.push('/admin/airlines')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Maskapai' : 'Tambah Maskapai Baru'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Kode Maskapai</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="GA" maxLength={3} />
          </div>
          <div className="space-y-2">
            <Label>Nama Maskapai</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Garuda Indonesia" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>URL Logo (opsional)</Label>
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="/airlines/garuda.png" />
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isEdit ? 'Simpan' : 'Tambah Maskapai'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </CardContent>
    </Card>
  )
}
