import { requireMobileUser } from '@/lib/mobile-api/auth'
import { fail, ok } from '@/lib/mobile-api/responses'
import { serializeProfile } from '@/lib/mobile-api/serializers'
import { isValidIndonesianPhone } from '@/lib/mobile-api/validators'
import type { Profile } from '@/lib/types'

export async function GET(request: Request) {
  const auth = await requireMobileUser(request)
  if ('error' in auth) return auth.error

  return ok({ profile: serializeProfile(auth.profile) })
}

export async function PATCH(request: Request) {
  const auth = await requireMobileUser(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (fullName.length < 2) {
      return fail('Nama minimal 2 karakter', 400)
    }

    if (phone && !isValidIndonesianPhone(phone)) {
      return fail('Gunakan nomor Indonesia, contoh 081234567890', 400)
    }

    const { data, error } = await auth.serviceClient
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.user.id)
      .select('id, full_name, email, avatar_url, phone, role, created_at, updated_at')
      .single()

    if (error || !data) {
      return fail('Gagal memperbarui profil', 500)
    }

    return ok({ profile: serializeProfile(data as Profile) })
  } catch (error) {
    console.error('Mobile profile update error:', error)
    return fail('Gagal memperbarui profil', 500)
  }
}
