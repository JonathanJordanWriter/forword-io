import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Server-side sign out — clears auth cookies before redirecting so the
// middleware correctly sees the user as unauthenticated on /login.
// Client-side signOut() + router.push() has a race condition where the
// middleware still reads the old cookie and bounces the user back.
export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'https://forword.io'),
    { status: 302 }
  )
}
