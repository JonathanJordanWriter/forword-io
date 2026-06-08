'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (tokenHash && type === 'recovery') {
        // Verify the token hash directly — no Supabase verify endpoint involved
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (error) {
          setError('This reset link has expired or already been used.')
        } else {
          setReady(true)
        }
        setChecking(false)
        return
      }

      // Fallback: check if already authenticated (came via auth/callback)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setReady(true)
      } else {
        setError('This reset link has expired or already been used.')
      }
      setChecking(false)
    }

    init()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="forword.io" width={140} height={40} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-brand-coal mb-2">Set a new password</h2>

          {checking ? (
            <div className="text-center py-6">
              <svg className="animate-spin w-6 h-6 text-brand-button mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-sm text-gray-500">Verifying reset link…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
              <a href="/forgot-password" className="text-sm text-brand-button hover:underline font-medium">
                Request a new reset link
              </a>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
