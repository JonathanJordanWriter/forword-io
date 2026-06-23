'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface BookListItem {
  id: string
  title: string
  stage: string
  genres: string[]
  plan?: { completion_pct: number } | null
  /** True when deleting this book would trigger an Author subscription transfer. */
  willTransferSub: boolean
  /** True when the user has already used their one transfer this calendar month. */
  hasAlreadySwitchedThisMonth: boolean
  /** Human-readable date like "June 1" when the next switch becomes available. */
  nextSwitchDate: string
}

interface Props {
  books: BookListItem[]
}

export default function DashboardBookList({ books }: Props) {
  const router = useRouter()

  // Which book's delete modal is currently open
  const [deletingBook, setDeletingBook] = useState<BookListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function openDelete(e: React.MouseEvent, book: BookListItem) {
    e.preventDefault()
    e.stopPropagation()
    setDeletingBook(book)
    setDeleteError(null)
  }

  function closeModal() {
    if (deleting) return
    setDeletingBook(null)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deletingBook) return
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/books/${deletingBook.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429 || data.error === 'monthly_limit_reached') {
          setDeleteError(
            data.message ??
            `You've already switched your Author subscription this month. You can switch again on ${deletingBook.nextSwitchDate}.`
          )
        } else {
          setDeleteError(data.error ?? 'Something went wrong. Please try again.')
        }
        setDeleting(false)
        return
      }

      // Success — close modal and refresh the page
      setDeletingBook(null)
      router.refresh()
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Book list */}
      <div className="space-y-3">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => router.push(`/dashboard/plan/${book.id}`)}
            className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 hover:border-brand-button hover:bg-brand-accent/10 transition-all group cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-brand-coal group-hover:text-brand-button transition-colors line-clamp-2">
                {book.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {book.genres.length > 0 && (
                  <span className="text-xs text-gray-500">{book.genres.join(', ')}</span>
                )}
                {book.genres.length > 0 && (
                  <span className="text-gray-300 text-xs">·</span>
                )}
                <span className="text-xs text-gray-500">{book.stage}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4 shrink-0">
              {/* Plan progress / status badge */}
              {book.plan ? (
                book.plan.completion_pct > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-button rounded-full"
                        style={{ width: `${book.plan.completion_pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium tabular-nums">
                      {book.plan.completion_pct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                    Ready to start
                  </span>
                )
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-accent/20 text-brand-button font-medium border border-brand-accent/40">
                  Draft plan
                </span>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => openDelete(e, book)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete project"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Row chevron */}
              <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-button transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {deletingBook && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Case 1: Transfer would happen but monthly limit is already used */}
            {deletingBook.willTransferSub && deletingBook.hasAlreadySwitchedThisMonth && (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-brand-coal text-center mb-2">Monthly switch limit reached</h2>
                <p className="text-sm text-gray-500 text-center mb-1">
                  You&apos;ve already switched your Author subscription to a new title this month.
                </p>
                <p className="text-sm text-gray-500 text-center mb-6">
                  You can switch again on <strong>{deletingBook.nextSwitchDate}</strong>, or upgrade to Author Pro for unlimited projects with no switching limits.
                </p>
                <div className="flex gap-3">
                  <a
                    href="/dashboard/settings"
                    className="flex-1 py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity text-center"
                  >
                    Upgrade to Author Pro
                  </a>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Case 2: Transfer would happen and monthly slot is available */}
            {deletingBook.willTransferSub && !deletingBook.hasAlreadySwitchedThisMonth && (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-brand-coal text-center mb-2">This will transfer your Author access</h2>
                <p className="text-sm text-gray-500 text-center mb-1">
                  Deleting <strong>&ldquo;{deletingBook.title}&rdquo;</strong> will move your full 90-day access to your next project.
                </p>
                <p className="text-sm text-gray-500 text-center mb-1">
                  You can only do this <strong>once per month</strong> — your next switch after this would be available on <strong>{deletingBook.nextSwitchDate}</strong>.
                </p>
                <p className="text-sm text-center mb-6">
                  <a href="/dashboard/settings" className="text-brand-button font-medium underline hover:opacity-80">
                    Upgrade to Author Pro
                  </a>
                  {' '}for unlimited projects with no switching limits.
                </p>
                {deleteError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{deleteError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete and transfer access'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={deleting}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Case 3: Standard delete — no subscription transfer involved */}
            {!deletingBook.willTransferSub && (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-brand-coal text-center mb-2">
                  Delete &ldquo;{deletingBook.title}&rdquo;?
                </h2>
                <p className="text-sm text-gray-500 text-center mb-6">
                  This will permanently delete this project and its entire 90-day plan. This cannot be undone.
                </p>
                {deleteError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{deleteError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete it'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={deleting}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
