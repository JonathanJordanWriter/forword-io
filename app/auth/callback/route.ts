import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Supabase redirects here after email verification or password reset.
// Two possible flows:
//   - PKCE (code param): used by password reset and some OAuth flows
//   - OTP token hash (token_hash + type params): used by email confirmation links
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'signup' | 'recovery' | 'email_change' | null

  // Password reset → /reset-password; everything else → /onboarding
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/onboarding')

  const supabase = createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
