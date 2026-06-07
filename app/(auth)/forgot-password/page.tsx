'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — send a 6-digit OTP to the user's email
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    // signInWithOtp sends an email containing a 6-digit code (and a magic link).
    // shouldCreateUser: false means it errors silently for unknown emails —
    // we always show the code step so we don't reveal whether an account exists.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)

    if (otpError) {
      setError(`Error: ${otpError.message}`)
      return
    }

    setStep('code')
  }

  // Step 2 — verify the code and redirect to the reset form
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      setError('Invalid or expired code. Please try again or request a new one.')
      setLoading(false)
      return
    }

    // User is now authenticated — send them to set a new password
    router.push('/reset-password')
  }

  // ── Step 2: enter the code ─────────────────────────────────────────────────
  if (step === 'code') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-brand-coal mb-2">Check your email</h2>
        <p className="text-sm text-gray-500 mb-6">
          We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
          Enter it below to continue.
        </p>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent text-center tracking-[0.4em] font-mono"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Verifying…' : 'Verify code'}
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <button
            type="button"
            onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
            className="text-sm text-brand-button hover:underline"
          >
            Resend code
          </button>
          <p className="text-sm text-gray-400">·</p>
          <button
            type="button"
            onClick={() => { setStep('email'); setCode(''); setError(null) }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    )
  }

  // ── Step 1: enter email ────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-brand-coal mb-2">Reset your password</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we&apos;ll send you a 6-digit code to reset your password.
      </p>
      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
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
          {loading ? 'Sending code…' : 'Send reset code'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Remember your password?{' '}
        <Link href="/login" className="text-brand-button hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  )
}
