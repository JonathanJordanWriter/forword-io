'use client'

import { useState, useEffect } from 'react'

interface Props {
  bookId: string
  /** The book's time_per_week setting — used to show an approximate task count. */
  timePerWeek?: string
  /** True if the user is on the free Starter tier. */
  isStarterTier?: boolean
}

// Approximate task counts, matching the estimates shown during onboarding.
const TASK_ESTIMATES_30: Record<string, string> = {
  '1_2hrs': '~12–15 focused tasks',
  '3_5hrs': '~18–22 focused tasks',
  '6_10hrs': '~25–30 focused tasks',
}
const TASK_ESTIMATES_90: Record<string, string> = {
  '1_2hrs': '~35–45 tasks',
  '3_5hrs': '~55–65 tasks',
  '6_10hrs': '~75–90 tasks',
}
const TIME_LABELS: Record<string, string> = {
  '1_2hrs': '1–2 hrs/week',
  '3_5hrs': '3–5 hrs/week',
  '6_10hrs': '6–10 hrs/week',
}

// Rotating status messages to reassure the user during the wait
const MESSAGES = [
  'Analysing your book profile…',
  'Mapping your genre and platforms…',
  'Building your 90-day timeline…',
  'Drafting week-by-week tasks…',
  'Almost there…',
]

export default function GeneratePlanButton({ bookId, timePerWeek, isStarterTier }: Props) {
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
            This usually takes 3–5 minutes. Don&apos;t close this tab.
          </p>
          {/* Progress bar animates over 90 seconds */}
          <div className="w-full max-w-xs mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-button rounded-full animate-[progress_90s_ease-in-out_forwards]" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Draft my {isStarterTier ? '30-day' : '90-day'} plan
          </button>
          {/* Option B: one-line task-count context, so users know what to expect before the 1–2 min wait */}
          {timePerWeek && (
            <p className="text-xs text-gray-400 max-w-xs text-center">
              Based on {TIME_LABELS[timePerWeek] ?? timePerWeek}, your plan will include approximately{' '}
              {isStarterTier
                ? <>{TASK_ESTIMATES_30[timePerWeek] ?? 'a focused set of tasks'} across 30 days</>
                : <>{TASK_ESTIMATES_90[timePerWeek] ?? 'a full task set'} across 90 days</>
              }, paced to your schedule.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
