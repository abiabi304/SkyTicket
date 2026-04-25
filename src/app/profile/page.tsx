export const dynamic = 'force-dynamic'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { ProfileForm } from '@/components/profile/profile-form'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/profile')
  }

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login?redirect=/profile')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile as Profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <ProfileForm profile={profile as Profile} />
      </main>
      <MobileNav />
    </div>
  )
}
