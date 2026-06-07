import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  // Create the redirect response first so we can attach cookie deletions to it.
  // The previous approach used createClient() which writes cookies via next/headers
  // but those changes don't carry over to a new NextResponse object.
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'https://forword.io'),
    { status: 302 }
  )

  // Wire the Supabase client directly to the response's cookie jar so that
  // signOut()'s cookie deletions are written onto the redirect response itself.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()

  return response
}
