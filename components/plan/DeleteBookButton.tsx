'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookId: string
  bookTitle: string
  /** True when deleting this book will transfer the Author subscription to another title. */
  willTransferSub: boolean
  /** True when the user has already used their one transfer this calendar month. */
  hasAlreadySwitchedThisMonth: boolean
  /** Human-readable date like "June 1" when the next switch becomes available. */
  nextSwitchDate: string
}

export default function DeleteBookButton({
  bookId,
  bookTitle,
  willTransferSub,
  hasAlreadySwitchedThisMonth,
  nextSwitchDate,
}: Props) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        // Server-side monthly-limit check (safety net if client state is stale)
        if (res.status === 429 || data.error === 'monthly_limit_reached') {
          setError(data.message ?? `You've already switched your Author subscription this month. You can switch again on ${nextSwitchDate}.`)
        } else {
          setError(data.error ?? 'Something went wrong. Please try again.')
        }
        setDeleting(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  function handleOpen() {
    setShowConfirm(true)
    setError(null)
  }

  function handleCancel() {
    setShowConfirm(false)
    setError(null)
  }

  // ── Confirmation panel ────────────────────────────────────────────────────
  if (showConfirm) {
    // Case 1: Would trigger a transfer BUT user has already switched this month
    if (willTransferSub && hasAlreadySwitchedThisMonth) {
      return (
        <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Monthly switch limit reached
          </p>
          <p className="text-xs text-amber-700 mb-4">
            You&apos;ve already switched your Author subscription to a new title this month.
            You can switch again on <strong>{nextSwitchDate}</strong>, or upgrade to Author Pro
            for unlimited projects with no switching limits.
          </p>
          <div className="flex gap-2 flex-wrap">
            <a
              href="/dashboard/settings"
              className="px-3 py-1.5 bg-brand-button text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Upgrade to Author Pro
            </a>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    // Case 2: Would trigger a transfer and the monthly slot is still available — warn first
    if (willTransferSub && !hasAlreadySwitchedThisMonth) {
      return (
        <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            This will transfer your Author access
          </p>
          <p className="text-xs text-amber-700 mb-1">
            Deleting <strong>&ldquo;{bookTitle}&rdquo;</strong> will move your full 90-day access to
            your next project. You can only do this <strong>once per month</strong> — your next
            switch after this would be available on <strong>{nextSwitchDate}</strong>.
          </p>
          <p className="text-xs text-amber-600 mb-4">
            Want unlimited projects with no switching limits?{' '}
            <a href="/dashboard/settings" className="font-medium underline hover:text-amber-800">
              Upgrade to Author Pro →
            </a>
          </p>
          {error && (
            <p className="text-xs text-red-700 mb-3 font-medium">{error}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 bg-amber-700 text-white text-xs font-medium rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Deleting…' : 'Yes, delete and transfer access'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={deleting}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    // Case 3: No transfer involved — standard delete confirmation
    return (
      <div className="mt-6 p-4 rounded-xl border border-red-200 bg-red-50">
        <p className="text-sm font-medium text-red-800 mb-1">
          Delete &ldquo;{bookTitle}&rdquo;?
        </p>
        <p className="text-xs text-red-600 mb-4">
          This will permanently delete this project and its entire 90-day plan. This cannot be undone.
        </p>
        {error && (
          <p className="text-xs text-red-700 mb-3 font-medium">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Deleting…' : 'Yes, delete it'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={deleting}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Collapsed state — just the trigger link ───────────────────────────────
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
      >
        Delete this project
      </button>
    </div>
  )
}
