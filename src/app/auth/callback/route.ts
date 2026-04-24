import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/'

  // Validate redirect to prevent open redirect attacks
  const safeRedirect = (redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeRedirect}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
