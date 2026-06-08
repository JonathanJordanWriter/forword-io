import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Verifies the password reset token_hash server-side and redirects
// to /reset-password with the session already established in cookies.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const response = NextResponse.redirect(`${origin}/reset-password`)

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

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'recovery',
  })

  if (error) {
    console.error('verify-reset error:', error.message)
    return NextResponse.redirect(`${origin}/forgot-password?error=expired`)
  }

  // Session is now set in cookies on the redirect response
  return response
}
