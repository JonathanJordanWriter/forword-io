'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import SignOutButton from '@/components/SignOutButton'


export default function SettingsPage() {
  // --- Billing ---
  const [tier, setTier] = useState<string>('starter')
  const [portalLoading, setPortalLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [confirmPlan, setConfirmPlan] = useState<'author' | 'pro' | null>(null)

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

  // --- Delete account ---
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
    // Show confirmation modal before upgrading
    setConfirmPlan('pro')
  }

  async function handleConfirmedUpgrade() {
    if (!confirmPlan) return
    const plan = confirmPlan
    setConfirmPlan(null)
    await handleUpgrade(plan)
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

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setDeleteError(data.error ?? 'Something went wrong. Please try again.')
        setDeleteLoading(false)
        return
      }
      // Sign out and redirect to the home page
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setDeleteLoading(false)
    }
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
              href="/dashboard/rewards"
              className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors"
            >
              Rewards
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

          <div className="space-y-3">

            {/* Free tier */}
            <div className={`rounded-xl border p-5 ${tier === 'starter' ? 'border-brand-button bg-brand-accent/10' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-brand-coal">Free</p>
                    {tier === 'starter' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-button text-white font-medium">Current plan</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">30-day marketing plans for up to 2 books.</p>
                </div>
                <p className="text-sm font-bold text-brand-coal shrink-0">$0</p>
              </div>
              {tier === 'starter' && (
                <button
                  onClick={() => handleUpgrade('author')}
                  disabled={upgradeLoading}
                  className="mt-4 w-full py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {upgradeLoading ? 'Loading…' : 'Upgrade to Author — $9/mo'}
                </button>
              )}
            </div>

            {/* Author tier */}
            <div className={`rounded-xl border p-5 ${tier === 'author' ? 'border-brand-button bg-brand-accent/10' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-brand-coal">Author</p>
                    {tier === 'author' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-button text-white font-medium">Current plan</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">90-day plan for 1 book of your choice. Unlimited 30-day plans for all other books.</p>
                </div>
                <p className="text-sm font-bold text-brand-coal shrink-0">$9/mo</p>
              </div>
              {tier === 'starter' && (
                <button
                  onClick={() => handleUpgrade('author')}
                  disabled={upgradeLoading}
                  className="mt-4 w-full py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {upgradeLoading ? 'Loading…' : 'Upgrade to Author — $9/mo'}
                </button>
              )}
              {tier === 'author' && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="mt-4 w-full py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {portalLoading ? 'Loading…' : 'Manage billing'}
                </button>
              )}
            </div>

            {/* Launch Pro tier */}
            <div className={`rounded-xl border p-5 ${tier === 'pro' ? 'border-brand-button bg-brand-accent/10' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-brand-coal">Launch Pro</p>
                    {tier === 'pro' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-button text-white font-medium">Current plan</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Full 90-day plans for unlimited books. No restrictions.</p>
                </div>
                <p className="text-sm font-bold text-brand-coal shrink-0">$19/mo</p>
              </div>
              {(tier === 'starter' || tier === 'author') && (
                <button
                  onClick={() => handleUpgradePro()}
                  disabled={upgradeLoading}
                  className="mt-4 w-full py-2.5 border-2 border-brand-button text-brand-button text-sm font-semibold rounded-xl hover:bg-brand-accent/10 disabled:opacity-50 transition-colors"
                >
                  {upgradeLoading ? 'Loading…' : 'Upgrade to Launch Pro — $19/mo'}
                </button>
              )}
              {tier === 'pro' && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="mt-4 w-full py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {portalLoading ? 'Loading…' : 'Manage billing'}
                </button>
              )}
            </div>

          </div>
          <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime. No long-term commitment.</p>
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
        <div className="mb-10">
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

        <div className="border-t border-gray-100 mb-10" />

        {/* Danger zone */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-red-600 mb-1">Delete account</h2>
          <p className="text-sm text-gray-500 mb-4">
            Permanently delete your forword.io account and all associated data — books, plans, and tasks. This cannot be undone.
          </p>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null) }}
            className="px-5 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-brand-coal text-center mb-2">Delete your account?</h2>
            <p className="text-sm text-gray-500 text-center mb-1">
              This will permanently delete your account and all of your data — including your books, plans, and tasks.
            </p>
            <p className="text-sm font-medium text-red-600 text-center mb-6">
              This action cannot be undone.
            </p>

            {/* Confirm by typing DELETE */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleteLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {deleteError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade confirmation modal */}
      {confirmPlan && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setConfirmPlan(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-brand-coal mb-2">
              Upgrade to {confirmPlan === 'pro' ? 'Launch Pro' : 'Author'}?
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              {confirmPlan === 'pro'
                ? 'You\'ll be upgraded to Launch Pro at $19/month. Your card on file will be charged the prorated difference for the remainder of your current billing period.'
                : 'You\'ll be upgraded to Author at $9/month. Your card on file will be charged today.'}
            </p>
            <p className="text-xs text-gray-400 mb-6">You can cancel or downgrade anytime from Account Settings.</p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmedUpgrade}
                disabled={upgradeLoading}
                className="flex-1 py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {upgradeLoading ? 'Upgrading…' : 'Yes, upgrade my plan'}
              </button>
              <button
                onClick={() => setConfirmPlan(null)}
                disabled={upgradeLoading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
