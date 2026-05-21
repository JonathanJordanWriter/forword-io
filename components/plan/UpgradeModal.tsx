'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  bookId: string
}

export default function UpgradeModal({ onClose, bookId }: Props) {
  const [loading, setLoading] = useState<'author' | 'pro' | null>(null)

  async function handleUpgrade(plan: 'author' | 'pro') {
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, bookId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-brand-accent/30 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-brand-button" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-coal mb-1">Unlock your full 90-day plan</h2>
          <p className="text-gray-500 text-sm">
            Your free plan includes the first 30 days. Upgrade to access all 90 days and keep your momentum going.
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">

          {/* Author plan */}
          <div className="border-2 border-brand-button rounded-xl p-4 relative">
            <div className="absolute -top-3 left-4">
              <span className="bg-brand-button text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Most popular
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-brand-coal">Author</p>
                <p className="text-xs text-gray-500 mt-0.5">Full 90-day plan for 1 active book</p>
                <ul className="mt-2 space-y-0.5">
                  {[
                    'Full 90-day personalized marketing plan',
                    'All tasks unlocked — no day-30 cutoff',
                    'Regenerate your plan anytime',
                    '1 active book',
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
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-bold text-brand-coal">$9</p>
                <p className="text-xs text-gray-400">/month</p>
              </div>
            </div>
            <button
              onClick={() => handleUpgrade('author')}
              disabled={loading !== null}
              className="mt-4 w-full py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading === 'author' ? 'Redirecting to checkout…' : 'Get Author — $9/mo'}
            </button>
          </div>

          {/* Pro plan */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-brand-coal">Launch Pro</p>
                <p className="text-xs text-gray-500 mt-0.5">Everything in Author plus unlimited active books</p>
                <ul className="mt-2 space-y-0.5">
                  {[
                    'Everything in Author',
                    'Unlimited active books',
                    'Full 90-day plan for every title',
                    'No monthly switching limits',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-bold text-brand-coal">$19</p>
                <p className="text-xs text-gray-400">/month</p>
              </div>
            </div>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading !== null}
              className="mt-4 w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading === 'pro' ? 'Redirecting to checkout…' : 'Get Launch Pro — $19/mo'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          Cancel anytime. No long-term commitment.
        </p>
      </div>
    </div>
  )
}
