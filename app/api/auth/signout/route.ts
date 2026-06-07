import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'https://forword.io'),
    { status: 302 }
  )

  // Invalidate the session on Supabase's servers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  await supabase.auth.signOut()

  // Explicitly delete every Supabase cookie from the response so the
  // browser removes them regardless of how signOut() handled them.
  request.cookies.getAll()
    .filter(c => c.name.startsWith('sb-'))
    .forEach(c => response.cookies.delete(c.name))

  return response
}
