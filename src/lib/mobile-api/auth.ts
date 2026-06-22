import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fail } from './responses'

function bearerTokenFrom(request: Request) {
  const authHeader = request.headers.get('authorization')
  return authHeader?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null
}

async function getBearerUser(request: Request) {
  const token = bearerTokenFrom(request)
  if (!token) return null

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: fail('Unauthorized', 401) }
  }

  const serviceClient = await createServiceClient()
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id, full_name, email, avatar_url, phone, role, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: fail('Profile tidak ditemukan', 404) }
  }

  if (profile.role !== 'user') {
    return { error: fail('Endpoint ini hanya untuk user', 403) }
  }

  return { supabase, serviceClient, user, profile }
}

export async function requireMobileUser(request: Request) {
  const auth = await getBearerUser(request)
  if (!auth) {
    return { error: fail('Unauthorized', 401) }
  }
  return auth
}

export async function requireAuthenticatedUser(request: Request) {
  const bearerAuth = await getBearerUser(request)
  if (bearerAuth) return bearerAuth

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: fail('Unauthorized', 401) }
  }

  const serviceClient = await createServiceClient()
  return { supabase, serviceClient, user, profile: null }
}
