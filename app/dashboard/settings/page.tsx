'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import SignOutButton from '@/components/SignOutButton'

const TIER_LABELS: Record<string, string> = {
  starter: 'Free',
  author: 'Author — $9/mo',
  pro: 'Launch Pro — $19/mo',
}

export default function SettingsPage() {
  // --- Billing ---
  const [tier, setTier] = useState<string>('starter')
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  // --- Email update ---
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // --- Password update ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadTier() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('tier').eq('id', user.id).single()
      if (data?.tier) setTier(data.tier)
    }
    loadTier()
  }, [])

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Could not open billing portal. Please try again.')
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleUpgrade(plan: 'author' | 'pro' = 'author') {
    setUpgradeLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else window.location.href = '/dashboard/settings?upgraded=1'
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setUpgradeLoading(false)
    }
  }

  function handleUpgradePro() {
    return handleUpgrade('pro')
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault()
    setEmailMessage(null)
    setEmailLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      setEmailMessage({ type: 'error', text: error.message })
    } else {
      setEmailMessage({
        type: 'success',
        text: 'Confirmation email sent to your new address. Click the link to complete the change.',
      })
      setNewEmail('')
    }
    setEmailLoading(false)
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()

    // Re-authenticate with current password first to verify identity
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPasswordMessage({ type: 'error', text: 'Could not verify your session. Please log in again.' })
      setPasswordLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordMessage({ type: 'error', text: 'Current password is incorrect.' })
      setPasswordLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordMessage({ type: 'error', text: error.message })
    } else {
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="forword.io" width={120} height={34} />
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors"
            >
              Your plans
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-sm text-brand-button font-medium"
            >
              Account settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold text-brand-coal mb-1">Account settings</h1>
        <p className="text-gray-500 text-sm mb-10">Manage your subscription, email address, and password.</p>

        {/* Billing section */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-brand-coal mb-1">Subscription</h2>
          <p className="text-sm text-gray-500 mb-4">Your current plan and billing details.</p>

          {/* Current plan row */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-brand-coal">{TIER_LABELS[tier] ?? tier}</p>
              {tier === 'starter' && (
                <p className="text-xs text-gray-500 mt-0.5">First 30 days of your plan · 3 post prompts/week</p>
              )}
              {tier === 'author' && (
                <p className="text-xs text-gray-500 mt-0.5">Full 90-day plan · calendar export · post prompts · 1 active book</p>
              )}
              {tier === 'pro' && (
                <p className="text-xs text-gray-500 mt-0.5">Everything in Author · unlimited books · no switching limits</p>
              )}
            </div>
            <div className="flex gap-2 ml-4 shrink-0">
              {tier === 'starter' ? (
                <button
                  onClick={() => handleUpgrade('author')}
                  disabled={upgradeLoading}
                  className="px-4 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {upgradeLoading ? 'Loading…' : 'Upgrade to Author'}
                </button>
              ) : (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  {portalLoading ? 'Loading…' : 'Manage billing'}
                </button>
              )}
            </div>
          </div>

          {/* Launch Pro upsell — shown to Author tier only */}
          {tier === 'author' && (
            <div className="border-2 border-brand-button rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-brand-coal">Upgrade to Launch Pro</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/30 text-brand-button font-medium">$19/mo</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Everything in Author, plus the ability to market multiple books at once — no switching limits.</p>
                  <ul className="space-y-1">
                    {[
                      'Unlimited active books — market every title at once',
                      'Switch between projects anytime, no monthly limits',
                      'Full 90-day plan for every book in your library',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-brand-button shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => handleUpgradePro()}
                disabled={upgradeLoading}
                className="mt-4 w-full py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {upgradeLoading ? 'Loading…' : 'Upgrade to Launch Pro — $19/mo'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Cancel anytime. You&apos;ll only be charged the difference.</p>
            </div>
          )}

          {/* Starter upsell — show Author + Pro options */}
          {tier === 'starter' && (
            <div className="border border-gray-200 rounded-xl p-5 mt-4">
              <p className="text-sm font-semibold text-brand-coal mb-1">Also available: Launch Pro — $19/mo</p>
              <p className="text-xs text-gray-500 mb-3">Everything in Author plus unlimited active books and no switching limits — ideal if you&apos;re marketing more than one title.</p>
              <button
                onClick={() => handleUpgradePro()}
                disabled={upgradeLoading}
                className="w-full py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {upgradeLoading ? 'Loading…' : 'Get Launch Pro — $19/mo'}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 mb-10" />

        {/* Email section */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-brand-coal mb-1">Email address</h2>
          <p className="text-sm text-gray-500 mb-4">
            We&apos;ll send a confirmation link to your new address before the change takes effect.
          </p>
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New email address</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
              />
            </div>
            {emailMessage && (
              <p className={`text-sm rounded-lg px-3 py-2 ${
                emailMessage.type === 'success'
                  ? 'text-green-700 bg-green-50'
                  : 'text-red-600 bg-red-50'
              }`}>
                {emailMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="px-5 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {emailLoading ? 'Sending confirmation…' : 'Update email'}
            </button>
          </form>
        </div>

        <div className="border-t border-gray-100 mb-10" />

        {/* Password section */}
        <div>
          <h2 className="text-base font-semibold text-brand-coal mb-1">Password</h2>
          <p className="text-sm text-gray-500 mb-4">
            Choose a strong password of at least 8 characters.
          </p>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
              />
            </div>
            {passwordMessage && (
              <p className={`text-sm rounded-lg px-3 py-2 ${
                passwordMessage.type === 'success'
                  ? 'text-green-700 bg-green-50'
                  : 'text-red-600 bg-red-50'
              }`}>
                {passwordMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {passwordLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
