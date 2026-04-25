export const dynamic = 'force-dynamic'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { PopularRoutes } from '@/components/home/popular-routes'
import type { PopularRoute } from '@/components/home/popular-routes'
import type { Airport, Profile } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: airports }, { data: { user } }, { data: flights }] = await Promise.all([
    supabase.from('airports').select('*').order('city'),
    supabase.auth.getUser(),
    supabase
      .from('flights')
      .select(`
        price,
        seat_class,
        available_seats,
        departure_airport:airports!flights_departure_airport_id_fkey(code, city),
        arrival_airport:airports!flights_arrival_airport_id_fkey(code, city)
      `)
      .gt('available_seats', 0)
      .eq('seat_class', 'economy'),
  ])

  let profile: Profile | null = null
  if (user) {
    const serviceClient = await createServiceClient()
    const { data } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  // Aggregate popular routes: group by route, find min price, count flights
  const routeMap = new Map<string, PopularRoute>()

  if (flights) {
    for (const flight of flights) {
      const dep = flight.departure_airport as unknown as { code: string; city: string }
      const arr = flight.arrival_airport as unknown as { code: string; city: string }
      if (!dep || !arr) continue

      const key = `${dep.code}-${arr.code}`
      const existing = routeMap.get(key)

      if (existing) {
        existing.minPrice = Math.min(existing.minPrice, flight.price)
        existing.flightCount += 1
      } else {
        routeMap.set(key, {
          from: dep.code,
          fromCity: dep.city,
          to: arr.code,
          toCity: arr.city,
          minPrice: flight.price,
          flightCount: 1,
        })
      }
    }
  }

  // Sort by flight count (most popular first), take top 8
  const popularRoutes = Array.from(routeMap.values())
    .sort((a, b) => b.flightCount - a.flightCount)
    .slice(0, 8)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile} />
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSection airports={(airports as Airport[]) ?? []} />
        <PopularRoutes routes={popularRoutes} />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
