'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { getAirlineLogoUrl } from '@/lib/supabase/storage'
import type { Airline } from '@/lib/types'

interface AirlineFormProps {
  airline?: Airline | null
}

export function AirlineForm({ airline }: AirlineFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!airline
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [code, setCode] = useState(airline?.code ?? '')
  const [name, setName] = useState(airline?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(airline?.logo_url ?? '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    airline?.logo_url ? getAirlineLogoUrl(airline.logo_url) : null
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!code) {
      toast.error('Isi kode maskapai terlebih dahulu')
      return
    }

    setUploading(true)
    const filename = `${code.toUpperCase()}.png`

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    const { error } = await supabase.storage
      .from('airlines')
      .upload(filename, file, { upsert: true })

    if (error) {
      toast.error('Gagal mengupload logo')
      setPreviewUrl(airline?.logo_url ? getAirlineLogoUrl(airline.logo_url) : null)
    } else {
      setLogoUrl(filename)
      setPreviewUrl(getAirlineLogoUrl(filename))
      toast.success('Logo berhasil diupload')
    }
    setUploading(false)
  }

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

        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Logo Maskapai</Label>
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo preview" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || !code}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {uploading ? 'Mengupload...' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {!code ? 'Isi kode maskapai terlebih dahulu' : 'PNG, JPG, atau WebP. Akan disimpan sebagai {kode}.png'}
              </p>
            </div>
          </div>
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
