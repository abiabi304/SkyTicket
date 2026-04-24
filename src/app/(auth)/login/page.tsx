import { Plane } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AuthTabs } from '@/components/auth/auth-tabs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk atau Daftar',
}

interface LoginPageProps {
  searchParams: { redirect?: string; tab?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams.redirect ?? '/'
  const defaultTab = searchParams.tab === 'register' ? 'register' : 'login'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Plane className="size-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold">SkyTicket</h1>
          </div>
          <AuthTabs redirectTo={redirectTo} defaultTab={defaultTab} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan melanjutkan, Anda menyetujui Syarat &amp; Ketentuan serta Kebijakan Privasi SkyTicket.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
