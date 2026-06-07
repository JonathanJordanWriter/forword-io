'use client'

export default function SignOutButton() {
  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    // Hard reload after the server has cleared cookies so the middleware
    // sees the session as gone and doesn't bounce back to /dashboard
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
