import { requireMobileUser } from '@/lib/mobile-api/auth'
import { ok } from '@/lib/mobile-api/responses'
import { serializeProfile } from '@/lib/mobile-api/serializers'

export async function GET(request: Request) {
  const auth = await requireMobileUser(request)
  if ('error' in auth) return auth.error

  return ok({ profile: serializeProfile(auth.profile) })
}
