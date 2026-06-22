import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Supabase redirects here after email verification or password reset with a one-time `code`.
// We exchange it for a session, then send the user on to their destination.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  // Password reset links should go to /reset-password; everything else (email
  // confirmation, magic link) goes to /onboarding for new users.
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/onboarding')

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
