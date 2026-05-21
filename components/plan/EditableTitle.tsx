'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  bookId: string
  initialTitle: string
}

export default function EditableTitle({ bookId, initialTitle }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    const trimmed = title.trim()
    if (!trimmed) { setError('Title can\'t be empty'); return }
    if (trimmed === (initialTitle || '')) { setEditing(false); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/books/${bookId}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) { setError('Failed to save — try again'); return }
      setEditing(false)
    } catch {
      setError('Network error — try again')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setTitle(initialTitle || ''); setEditing(false) }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={saving}
            className="text-2xl font-bold text-brand-coal bg-transparent border-b-2 border-brand-button outline-none w-full min-w-0"
          />
          {saving && (
            <svg className="animate-spin w-4 h-4 text-brand-button shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-gray-400">Press Enter to save · Esc to cancel</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold text-brand-coal">
        {title || <span className="text-gray-400 italic">Untitled book</span>}
      </h1>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit book title"
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-brand-button"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  )
}
