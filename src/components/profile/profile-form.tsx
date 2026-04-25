'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, LogOut, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploadingAvatar(true)
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${profile.id}/${timestamp}.${ext}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error('Gagal mengupload foto')
      setUploadingAvatar(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (updateError) {
      toast.error('Gagal memperbarui foto profil')
    } else {
      setAvatarUrl(publicUrl)
      toast.success('Foto profil berhasil diperbarui')
      router.refresh()
    }
    setUploadingAvatar(false)
  }

  const handleSave = async () => {
    if (fullName.length < 2) {
      toast.error('Nama minimal 2 karakter')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      toast.error('Gagal menyimpan perubahan')
    } else {
      toast.success('Profil berhasil diperbarui')
      router.refresh()
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6">
      <PageHeader title="Profil" />

      <div className="mt-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            className="group relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            <Avatar className="size-24 ring-2 ring-border ring-offset-2 ring-offset-background transition-opacity group-hover:opacity-80">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {profile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/30">
              {uploadingAvatar ? (
                <Loader2 className="size-6 animate-spin text-white" />
              ) : (
                <Camera className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <p className="mt-3 text-lg font-semibold">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Klik foto untuk mengubah (maks. 2MB)
          </p>
        </div>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah (terhubung dengan Google)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Logout */}
        <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2">
              <LogOut className="size-4" />
              Keluar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keluar dari SkyTicket?</DialogTitle>
              <DialogDescription>
                Anda akan keluar dari akun Anda. Anda perlu masuk kembali untuk mengakses pesanan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Ya, Keluar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
