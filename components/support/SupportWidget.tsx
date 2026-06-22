'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type Status = 'idle' | 'open' | 'sending' | 'success' | 'error'

export default function SupportWidget() {
  const [status, setStatus]       = useState<Status>('idle')
  const [message, setMessage]     = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function open()  { setStatus('open'); setMessage(''); setScreenshot(null); setErrorMsg(null) }
  function close() { setStatus('idle') }

  async function handleSubmit() {
    if (!message.trim()) { setErrorMsg('Please describe the issue.'); return }

    setStatus('sending')
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('message', message.trim())
    if (screenshot) formData.append('screenshot', screenshot)

    try {
      const res = await fetch('/api/support', { method: 'POST', body: formData })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setStatus('open')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('open')
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {status === 'idle' && (
        <button
          type="button"
          onClick={open}
          aria-label="Report an issue"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-brand-button text-white text-sm font-semibold rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M18.364 5.636A9 9 0 115.636 18.364 9 9 0 0118.364 5.636zM12 8v4m0 4h.01" />
          </svg>
          Support
        </button>
      )}

      {/* Modal */}
      {(status === 'open' || status === 'sending' || status === 'success') && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-brand-coal">Support</p>
              <button
                type="button"
                onClick={close}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* FAQ link */}
            {status !== 'success' && (
              <div className="px-5 pt-3 pb-1">
                <Link
                  href="/faq"
                  target="_blank"
                  className="flex items-center gap-2 text-xs text-brand-button font-medium hover:opacity-75 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Browse the FAQ first
                </Link>
              </div>
            )}

            {status === 'success' ? (
              /* Success state */
              <div className="px-5 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-brand-coal mb-1">Report received</p>
                <p className="text-xs text-gray-500 mb-5">Thanks for letting us know. We&apos;ll look into it shortly.</p>
                <button
                  type="button"
                  onClick={close}
                  className="text-sm font-medium text-brand-button hover:opacity-75 transition-opacity"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Form state */
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Can&apos;t find what you need? Tell us what&apos;s wrong.
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe the issue as clearly as you can — what you were doing, what you expected, and what happened instead."
                    rows={4}
                    disabled={status === 'sending'}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent resize-none disabled:opacity-50"
                  />
                </div>

                {/* Screenshot upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Screenshot <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  {screenshot ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 00-5.656-5.656L6 10.5" />
                      </svg>
                      <span className="text-xs text-gray-600 truncate flex-1">{screenshot.name}</span>
                      <button
                        type="button"
                        onClick={() => { setScreenshot(null); if (fileRef.current) fileRef.current.value = '' }}
                        className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={status === 'sending'}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-brand-button hover:text-brand-button transition-all disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Attach a screenshot
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setScreenshot(e.target.files?.[0] ?? null)}
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600">{errorMsg}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={status === 'sending'}
                  className="w-full py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </>
                  ) : 'Send report'}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Reports go to our support team. We&apos;ll review the email and follow up for more info if needed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
