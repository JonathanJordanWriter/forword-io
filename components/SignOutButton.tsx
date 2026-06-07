'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Use window.location for a hard redirect so all auth cookies
    // are fully cleared and the server session is reset
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors"
    >
      Sign out
    </button>
  )
}
