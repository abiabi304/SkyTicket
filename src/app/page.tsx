import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { PopularRoutes } from '@/components/home/popular-routes'
import type { Airport, Profile } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: airports }, { data: { user } }] = await Promise.all([
    supabase.from('airports').select('*').order('city'),
    supabase.auth.getUser(),
  ])

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSection airports={(airports as Airport[]) ?? []} />
        <PopularRoutes />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
