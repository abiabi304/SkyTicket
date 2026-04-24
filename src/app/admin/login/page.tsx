import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Login | SkyTicket',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="size-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">SkyTicket Administration</p>
          </div>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
