import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (request.nextUrl.pathname.startsWith('/flavors')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin, is_matrix_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
      return NextResponse.redirect(new URL('/not-authorized', request.url))
    }
  }

  return response
}

export const config = { matcher: ['/flavors/:path*'] }