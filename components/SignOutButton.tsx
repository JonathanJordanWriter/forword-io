'use client'

export default function SignOutButton() {
  async function handleSignOut() {
    // Don't follow the server redirect — let window.location do the navigation
    // after the server has cleared the auth cookies.
    await fetch('/api/auth/signout', {
      method: 'POST',
      redirect: 'manual',
    })
    window.location.replace('/login')
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
