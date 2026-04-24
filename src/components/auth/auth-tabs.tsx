'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginButton } from './login-button'
import { UserPlus, LogIn } from 'lucide-react'

interface AuthTabsProps {
  redirectTo: string
  defaultTab: string
}

export function AuthTabs({ redirectTo, defaultTab }: AuthTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login" className="gap-2">
          <LogIn className="size-4" />
          Masuk
        </TabsTrigger>
        <TabsTrigger value="register" className="gap-2">
          <UserPlus className="size-4" />
          Daftar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Selamat Datang Kembali</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke akun SkyTicket Anda
          </p>
        </div>
        <LoginButton redirectTo={redirectTo} />
      </TabsContent>

      <TabsContent value="register" className="mt-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Buat Akun Baru</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar dengan akun Google untuk mulai memesan tiket
          </p>
        </div>
        <LoginButton redirectTo={redirectTo} label="Daftar dengan Google" />
        <div className="rounded-lg bg-muted/50 p-3">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              Pesan tiket pesawat domestik dengan mudah
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              E-Ticket langsung tersedia setelah pembayaran
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              Riwayat pemesanan tersimpan aman
            </li>
          </ul>
        </div>
      </TabsContent>
    </Tabs>
  )
}
