'use client'

import { useState, useEffect } from 'react'

interface Props {
  bookId: string
}

// Rotating status messages to reassure the user during the wait
const MESSAGES = [
  'Analysing your book profile…',
  'Mapping your genre and platforms…',
  'Building your 90-day timeline…',
  'Drafting week-by-week tasks…',
  'Almost there…',
]

export default function GeneratePlanButton({ bookId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  // Rotate through status messages every 10 seconds while loading
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setMessageIndex(i => Math.min(i + 1, MESSAGES.length - 1))
    }, 10000)
    return () => clearInterval(interval)
  }, [loading])

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setMessageIndex(0)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Hard reload so the server component re-fetches and shows the new plan
      window.location.reload()
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-brand-button" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm font-medium text-brand-coal transition-all">
              {MESSAGES[messageIndex]}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            This usually takes 1–2 minutes. Don&apos;t close this tab.
          </p>
          {/* Progress bar animates over 90 seconds */}
          <div className="w-full max-w-xs mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-button rounded-full animate-[progress_90s_ease-in-out_forwards]" />
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Draft my 90-day plan
        </button>
      )}
    </div>
  )
}
