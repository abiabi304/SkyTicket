import { requireMobileUser } from '@/lib/mobile-api/auth'
import { fail, ok } from '@/lib/mobile-api/responses'
import { serializeAirline, serializeAirport } from '@/lib/mobile-api/serializers'
import type { Airline, Airport } from '@/lib/types'

export async function GET(request: Request) {
  const auth = await requireMobileUser(request)
  if ('error' in auth) return auth.error

  const { serviceClient } = auth
  const [airportsResult, airlinesResult] = await Promise.all([
    serviceClient
      .from('airports')
      .select('id, code, name, city, country, created_at')
      .order('city', { ascending: true }),
    serviceClient
      .from('airlines')
      .select('id, code, name, logo_url, created_at')
      .order('name', { ascending: true }),
  ])

  if (airportsResult.error || airlinesResult.error) {
    return fail('Gagal memuat data home', 500)
  }

  return ok({
    airports: ((airportsResult.data ?? []) as Airport[]).map(serializeAirport),
    airlines: ((airlinesResult.data ?? []) as Airline[]).map(serializeAirline),
    popularRoutes: [],
  })
}
