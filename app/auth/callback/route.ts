import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Supabase redirects here after email verification with a one-time `code`.
// We exchange it for a session, then send the user on to their destination.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' for password reset links

  // Email verification is disabled for beta, so auth/callback is only
  // hit by password reset links. Default to /reset-password.
  const next = searchParams.get('next') ?? '/reset-password'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something went wrong, send them to login with a helpful message
  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
