import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const protectedPaths = ['/booking', '/payment', '/my-bookings', '/profile']
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))
  const isAdminLogin = pathname === '/admin/login'
  const isAdminRoute = pathname.startsWith('/admin') && !isAdminLogin
  const isUserLogin = pathname === '/login'

  // Fetch profile ONCE if user is authenticated and route needs role check
  let userRole: string | null = null
  if (user && (isProtectedRoute || isAdminRoute || isAdminLogin)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null
  }

  // Unauthenticated → redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Admin trying to access user routes → redirect to admin panel
  if (isProtectedRoute && user && userRole === 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // Admin routes: must be authenticated admin
  if (isAdminRoute && (!user || userRole !== 'admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Admin login: already logged in as admin → redirect to dashboard
  if (isAdminLogin && user && userRole === 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  // User login: already logged in → redirect to home
  if (isUserLogin && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
