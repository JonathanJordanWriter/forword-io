'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import UpgradeModal from './UpgradeModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  day_number: number
  week_number: number
  phase: number
  title: string
  description: string
  category: string
  platform_tag: string
  estimated_mins: number
  is_completed: boolean
  is_locked: boolean
  is_custom?: boolean
}

interface Phase {
  phase_number: number
  title: string
  description: string
  week_start: number
  week_end: number
}

interface Plan {
  id: string
  plan_type: string
  total_tasks: number
  completion_pct: number
  current_phase: number
  raw_ai_output: {
    phases: {
      phase_number: number
      title: string
      description: string
      week_start: number
      week_end: number
    }[]
  }
}

interface Props {
  plan: Plan
  tasks: Task[]
  isStarterTier: boolean
  userTier?: string
  bookId: string
  initialTimePerWeek?: string
  initialTotalPoints?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  social:     'bg-purple-50 text-purple-700 border-purple-200',
  email:      'bg-blue-50 text-blue-700 border-blue-200',
  pr:         'bg-pink-50 text-pink-700 border-pink-200',
  publishing: 'bg-orange-50 text-orange-700 border-orange-200',
  foundation: 'bg-gray-100 text-gray-600 border-gray-200',
  planning:   'bg-teal-50 text-teal-700 border-teal-200',
}

const TIME_OPTIONS = [
  { value: '1_2hrs', label: '1–2 hrs / week', taskCount: 2 },
  { value: '3_5hrs', label: '3–5 hrs / week', taskCount: 3 },
  { value: '6_10hrs', label: '6–10 hrs / week', taskCount: 5 },
]

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  taskNumber,
  onToggle,
  onUpgradeClick,
}: {
  task: Task
  taskNumber: number
  onToggle: (id: string, val: boolean) => Promise<void>
  onUpgradeClick: () => void
}) {
  const [loading, setLoading] = useState(false)
  const categoryStyle = CATEGORY_STYLES[task.category] ?? CATEGORY_STYLES.foundation

  async function handleToggle() {
    if (task.is_locked) return
    setLoading(true)
    await onToggle(task.id, !task.is_completed)
    setLoading(false)
  }

  if (task.is_locked) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className="w-full text-left relative flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-brand-accent transition-all group"
      >
        <div className="absolute inset-0 rounded-xl backdrop-blur-sm bg-white/60 flex flex-col items-center justify-center z-10">
          <svg className="w-4 h-4 text-gray-400 mb-1 group-hover:text-brand-button transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-gray-500 font-medium group-hover:text-brand-button transition-colors">Upgrade to unlock</p>
        </div>
        <div className="flex-1 filter blur-sm select-none pointer-events-none">
          <p className="text-sm font-medium text-gray-900">Task {taskNumber} — {task.title}</p>
          <p className="text-xs text-gray-500 mt-1">{task.description}</p>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
        task.is_completed
          ? 'border-green-200 bg-green-50'
          : 'border-gray-100 bg-white hover:border-brand-accent'
      }`}
    >
      {/* Checkbox */}
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
        task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
      }`}>
        {task.is_completed && !loading && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {loading && (
          <svg className="animate-spin w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          Task {taskNumber} — {task.title}
        </p>
        <p className={`text-xs mt-0.5 ${task.is_completed ? 'text-gray-400' : 'text-gray-500'}`}>
          {task.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryStyle}`}>
            {task.category}
          </span>
          {task.platform_tag && task.platform_tag.toLowerCase() !== 'none' && task.platform_tag !== 'all' && (
            <span className="text-xs text-gray-400">{task.platform_tag}</span>
          )}
          {task.estimated_mins > 0 && (
            <span className="text-xs text-gray-400">{task.estimated_mins} min</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Celebration helpers ──────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#f97316',
]

function makeParticles(count: number, spread: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const dist = spread + (i % 3) * (spread * 0.4)
    return {
      tx: Math.round(Math.cos(angle) * dist),
      ty: Math.round(Math.sin(angle) * dist - spread * 0.3),
      tr: Math.round((angle * 180 / Math.PI) * 2.5),
      delay: (i % 5) * 0.05,
      size: 7 + (i % 3) * 3,
      round: i % 2 === 0,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }
  })
}

const TASK_PARTICLES = makeParticles(16, 55)
const PHASE_PARTICLES = makeParticles(28, 90)

const PHASE_MESSAGES: Record<number, string> = {
  1: 'Amazing! You just finished Phase 1. Keep moving your book forward!',
  2: "Congratulations! You knocked out Phase 2. Let's keep moving your book forward!",
  3: "You're halfway there! Phase 3 is complete — the momentum is building!",
  4: "Incredible work! Phase 4 is done. You're in the home stretch now!",
  5: "You did it! Phase 5 complete — your entire 90-day plan is finished. What an achievement!",
}


// ─── TaskCelebration — confetti burst + floating points text ─────────────────

function TaskCelebration({ points, onDone }: { points: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <p
        className="font-black text-3xl text-brand-button select-none"
        style={{ animation: 'pointsFloat 1.4s ease-out forwards', textShadow: '0 2px 12px rgba(99,102,241,0.4)' }}
      >
        +{points.toLocaleString()} pts!
      </p>
      {TASK_PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: p.size, height: p.size,
            borderRadius: p.round ? '50%' : '3px',
            backgroundColor: p.color,
            animation: `confettiBurst 1.2s ease-out ${p.delay}s forwards`,
            '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--tr': `${p.tr}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ─── PhaseCompleteModal ───────────────────────────────────────────────────────

function PhaseCompleteModal({ phase, bonus, onClose }: { phase: number; bonus: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative bg-white rounded-3xl px-8 py-8 max-w-sm w-full text-center shadow-2xl overflow-hidden">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {PHASE_PARTICLES.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', left: '50%', top: '50%',
                width: p.size, height: p.size,
                borderRadius: p.round ? '50%' : '3px',
                backgroundColor: p.color,
                animation: `confettiBurst 1.5s ease-out ${p.delay}s forwards`,
                '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--tr': `${p.tr}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-brand-coal mb-2">Phase {phase} Complete!</h2>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          {PHASE_MESSAGES[phase] ?? `Phase ${phase} complete! Keep up the great work!`}
        </p>

        <div className="bg-brand-accent/20 border border-brand-accent/40 rounded-2xl px-4 py-3 mb-5">
          <p className="text-xs text-gray-500 mb-0.5">Phase completion bonus</p>
          <p className="text-2xl font-black text-brand-button">+{bonus.toLocaleString()} pts</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-brand-button text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          Keep going! →
        </button>
      </div>
    </div>
  )
}

// ─── WeekHeader with inline time stepper ─────────────────────────────────────

function WeekHeader({
  weekNum,
  totalWeeks,
  taskCount,
  bookId,
  currentTime,
  onTimeSaved,
  canGoPrev,
  canGoNext,
  prevWeekNum,
  nextWeekNum,
  onPrev,
  onNext,
  timeChanged,
  regenerating,
  onRegenerate,
}: {
  weekNum: number
  totalWeeks: number
  taskCount: number
  bookId: string
  currentTime: string
  onTimeSaved: (newTime: string) => void
  canGoPrev: boolean
  canGoNext: boolean
  prevWeekNum: number | null
  nextWeekNum: number | null
  onPrev: () => void
  onNext: () => void
  timeChanged: boolean
  regenerating: boolean
  onRegenerate: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(false)

  const currentIndex = TIME_OPTIONS.findIndex(o => o.value === currentTime)
  const safeIndex = currentIndex === -1 ? 1 : currentIndex // default to middle
  const canGoDown = safeIndex > 0
  const canGoUp = safeIndex < TIME_OPTIONS.length - 1

  async function step(direction: -1 | 1) {
    const newIndex = safeIndex + direction
    if (newIndex < 0 || newIndex >= TIME_OPTIONS.length) return
    const newTime = TIME_OPTIONS[newIndex].value
    setSaving(true)
    try {
      await fetch(`/api/books/${bookId}/time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_per_week: newTime }),
      })
      onTimeSaved(newTime)
      setFlash(true)
      setTimeout(() => setFlash(false), 800)
    } catch {
      // silently fail
    }
    setSaving(false)
  }

  const label = TIME_OPTIONS[safeIndex].label

  return (
    <div className="mb-4">
      {/* Top row: week navigation */}
      <div className="flex items-center justify-center gap-4 mb-2">
        {/* Previous week button — always reserves space so centre stays centred */}
        <div className="w-24 flex justify-end">
          {canGoPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous week"
              className="flex items-center gap-1 text-sm font-semibold text-brand-button hover:opacity-75 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Week {prevWeekNum}
            </button>
          )}
        </div>

        {/* Centre label */}
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-coal">Week {weekNum} of {totalWeeks}</p>
          <p className="text-xs font-medium text-brand-button">
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Next week button */}
        <div className="w-24 flex justify-start">
          {canGoNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next week"
              className="flex items-center gap-1 text-sm font-semibold text-brand-button hover:opacity-75 transition-opacity"
            >
              Week {nextWeekNum}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: time availability stepper */}
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={!canGoDown || saving}
          aria-label="Reduce time"
          className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-button hover:text-brand-button disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>

        <span className={`text-xs font-medium px-2 min-w-[96px] text-center transition-colors ${
          flash ? 'text-brand-coal' : 'text-brand-button'
        }`}>
          {label}
        </span>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={!canGoUp || saving}
          aria-label="Increase time"
          className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-button hover:text-brand-button disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Inline redraft prompt — appears right below the stepper when time has changed */}
      {timeChanged && (
        <div className="mt-3 flex items-center justify-center gap-2 bg-brand-accent/20 border border-brand-accent/40 rounded-lg px-3 py-2">
          <p className="text-xs text-brand-coal">Time updated —</p>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1 text-xs font-semibold text-brand-button hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {regenerating ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Redrafting…
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Redraft plan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Time and category options for custom tasks ───────────────────────────────

const CUSTOM_TIME_OPTIONS = [
  { label: 'Under 15 min', value: 10 },
  { label: '15–30 min',    value: 20 },
  { label: '30–60 min',    value: 45 },
  { label: '1–2 hours',    value: 90 },
  { label: '2+ hours',     value: 120 },
]

const CUSTOM_CATEGORY_OPTIONS = [
  { value: 'planning',   label: 'Planning',      pts: 75  },
  { value: 'foundation', label: 'Foundation',    pts: 75  },
  { value: 'social',     label: 'Social',        pts: 100 },
  { value: 'email',      label: 'Email',         pts: 100 },
  { value: 'pr',         label: 'PR / Outreach', pts: 150 },
  { value: 'publishing', label: 'Publishing',    pts: 150 },
]

// ─── AddTaskForm ──────────────────────────────────────────────────────────────

function AddTaskForm({
  planId, weekNumber, phase, onAdd, onCancel,
}: {
  planId: string
  weekNumber: number
  phase: number
  onAdd: (task: Task) => void
  onCancel: () => void
}) {
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [estimatedMins, setEstimatedMins] = useState<number | null>(null)
  const [category, setCategory]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function handleSubmit() {
    if (!title.trim())        { setError('Please enter a task title.');         return }
    if (estimatedMins === null){ setError('Please select an estimated time.');  return }
    if (!category)            { setError('Please select a category.');          return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/plans/${planId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, estimated_mins: estimatedMins, category, week_number: weekNumber, phase }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to add task.'); return }
      onAdd(data.task as Task)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl space-y-4">
      <p className="text-sm font-semibold text-brand-coal">Add your own task</p>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="What do you want to do?"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
      />

      {/* Estimated time chips */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Estimated time</p>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_TIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEstimatedMins(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                estimatedMins === opt.value
                  ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-brand-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Add details (optional)"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent resize-none"
      />

      {/* Category chips */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">
          Category <span className="text-gray-400 font-normal">(determines points earned)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_CATEGORY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                category === opt.value
                  ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-brand-accent'
              }`}
            >
              {opt.label} <span className="opacity-60">+{opt.pts}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Adding…' : 'Add task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── TaskMoveActions — move-to-prev/next week controls shown below each task ──

function TaskMoveActions({
  task, prevWeekInPhase, nextWeekInPhase, onMoved,
}: {
  task: Task
  prevWeekInPhase: number | null
  nextWeekInPhase: number | null
  onMoved: (taskId: string, newWeek: number, newDay: number) => void
}) {
  const [open, setOpen]       = useState(false)
  const [moving, setMoving]   = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (task.is_locked) return null

  async function handleMove(direction: 'prev' | 'next') {
    setMoving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/tasks/${task.id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.message ?? 'Could not move task. Please try again.')
        setOpen(false)
      } else {
        onMoved(task.id, data.week_number, data.day_number)
      }
    } catch {
      setMessage('Network error. Please try again.')
      setOpen(false)
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="mt-1 pl-8 flex items-center gap-2 flex-wrap">
      {!open && !message && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-brand-button transition-colors"
        >
          Move task
        </button>
      )}

      {open && (
        <>
          {prevWeekInPhase !== null && (
            <button
              type="button"
              onClick={() => handleMove('prev')}
              disabled={moving}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-brand-button hover:text-brand-button disabled:opacity-40 transition-all"
            >
              ← Week {prevWeekInPhase}
            </button>
          )}
          {nextWeekInPhase !== null && (
            <button
              type="button"
              onClick={() => handleMove('next')}
              disabled={moving}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-brand-button hover:text-brand-button disabled:opacity-40 transition-all"
            >
              Week {nextWeekInPhase} →
            </button>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); setMessage(null) }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
          {moving && <span className="text-xs text-gray-400">Moving…</span>}
        </>
      )}

      {message && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1 w-full">
          {message}
        </p>
      )}
    </div>
  )
}

// ─── TaskReplaceAction — swap a task with a fresh AI suggestion ───────────────

function TaskReplaceAction({
  task,
  onReplaced,
}: {
  task: Task
  onReplaced: (updatedTask: Task) => void
}) {
  const [open, setOpen]       = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Don't render for locked or completed tasks
  if (task.is_locked || task.is_completed) return null

  async function handleReplace() {
    setReplacing(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${task.id}/replace`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not generate a replacement. Try again.')
        setOpen(false)
      } else {
        onReplaced(data.task as Task)
        setOpen(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setOpen(false)
    } finally {
      setReplacing(false)
    }
  }

  return (
    <div className="pl-8 flex items-center gap-2 flex-wrap -mt-0.5 mb-1">
      {replacing ? (
        <span className="text-xs text-brand-button flex items-center gap-1.5">
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Generating replacement…
        </span>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-brand-button transition-colors"
        >
          Replace this task
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Replace with a new AI suggestion?</span>
          <button
            type="button"
            onClick={handleReplace}
            className="text-xs px-2.5 py-1 rounded-full bg-brand-button text-white hover:opacity-90 transition-opacity"
          >
            Yes, replace it
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null) }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 w-full mt-0.5">{error}</p>
      )}
    </div>
  )
}

// ─── Main PlanView ─────────────────────────────────────────────────────────────

// ─── Helper: first week in a list that has an incomplete unlocked task ────────

function firstIncompleteWeek(weeksList: number[], tasksList: Task[]): number {
  const w = weeksList.find(wk =>
    tasksList.filter(t => t.week_number === wk && !t.is_locked).some(t => !t.is_completed)
  )
  return w ?? weeksList[0]
}

// ─── Helper: find the phase + week to resume on load / after upgrade ──────────
// Scans ALL tasks (not just current_phase) so the user always lands on their
// actual first unfinished task rather than the top of Phase 1.

function findResumePoint(tasksList: Task[]): { phase: number; week: number } {
  // First incomplete unlocked task, sorted by day so we get the earliest
  const firstIncomplete = [...tasksList]
    .filter(t => !t.is_locked && !t.is_completed)
    .sort((a, b) => a.day_number - b.day_number)[0]

  if (firstIncomplete) {
    return { phase: firstIncomplete.phase, week: firstIncomplete.week_number }
  }

  // All tasks complete — land on the last unlocked task's phase/week
  const lastUnlocked = [...tasksList]
    .filter(t => !t.is_locked)
    .sort((a, b) => b.day_number - a.day_number)[0]

  if (lastUnlocked) {
    return { phase: lastUnlocked.phase, week: lastUnlocked.week_number }
  }

  // Fallback: phase 1, week 1
  const phase1Weeks = Array.from(
    new Set(tasksList.filter(t => t.phase === 1).map(t => t.week_number))
  ).sort((a, b) => a - b)
  return { phase: 1, week: phase1Weeks[0] ?? 1 }
}

export default function PlanView({ plan, tasks: initialTasks, isStarterTier: _isStarterTier, userTier = 'starter', bookId, initialTimePerWeek = '3_5hrs', initialTotalPoints = 0 }: Props) {
  void _isStarterTier // retained in props for potential future use
  const [tasks, setTasks] = useState(initialTasks)
  const [totalPoints, setTotalPoints] = useState(initialTotalPoints)
  const [celebration, setCelebration] = useState<{ points: number } | null>(null)
  const [phaseComplete, setPhaseComplete] = useState<{ phase: number; bonus: number } | null>(null)
  // Track phases already celebrated so we don't re-trigger on re-renders
  const awardedPhasesRef = useRef<Set<number>>(new Set())
  // ── Resume point — scan ALL tasks to find where the user left off ───────────
  // This handles both normal login and post-upgrade reload correctly,
  // since window.location.reload() re-fetches tasks fresh from the server.
  const [activePhase, setActivePhase] = useState(() => findResumePoint(initialTasks).phase)
  const [activeWeek,  setActiveWeek]  = useState(() => findResumePoint(initialTasks).week)
  const [currentTime, setCurrentTime] = useState(initialTimePerWeek)
  const [timeChanged, setTimeChanged] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Pre-populate awardedPhasesRef with any phases already complete on load
  // so we never show the celebration modal for work done in a previous session.
  useEffect(() => {
    const phases = Array.from(new Set(initialTasks.map(t => t.phase)))
    for (const phase of phases) {
      const pts = initialTasks.filter(t => t.phase === phase && !t.is_locked)
      if (pts.length > 0 && pts.every(t => t.is_completed)) {
        awardedPhasesRef.current.add(phase)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the user switches phases, jump to that phase's first incomplete week
  useEffect(() => {
    const newPhaseTasks = tasks.filter(t => t.phase === activePhase)
    const newPhaseWeeks = Array.from(new Set(newPhaseTasks.map(t => t.week_number))).sort((a, b) => a - b)
    if (newPhaseWeeks.length > 0) {
      setActiveWeek(firstIncompleteWeek(newPhaseWeeks, newPhaseTasks))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhase])

  const completedCount_total = tasks.filter(t => t.is_completed).length

  // ── Persist "needs regeneration" across refreshes ──────────────────────────
  // sessionStorage key is scoped to this book so multiple tabs don't interfere.
  const regenStorageKey = `plan-needs-regen-${bookId}`

  // On mount: restore the banner if a previous time change wasn't acted on yet,
  // and listen for changes dispatched by EditableBookProfile on the same page.
  useEffect(() => {
    if (sessionStorage.getItem(regenStorageKey)) {
      setTimeChanged(true)
    }

    function handleExternalChange() {
      setTimeChanged(true)
    }

    window.addEventListener('plan-needs-regen', handleExternalChange)
    return () => window.removeEventListener('plan-needs-regen', handleExternalChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenStorageKey])

  function handleTimeSaved(newTime: string) {
    setCurrentTime(newTime)
    setTimeChanged(true)
    sessionStorage.setItem(regenStorageKey, '1')
  }

  async function handleRegenerate(hardReset = false) {
    setRegenerating(true)
    setRegenError(null)
    setConfirmReset(false)
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, regenerate: true, hardReset }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRegenError(data.error ?? 'Regeneration failed. Please try again.')
        setRegenerating(false)
        return
      }
      // Clear the flag before reloading — plan is being regenerated
      sessionStorage.removeItem(regenStorageKey)
      window.location.reload()
    } catch {
      setRegenError('Network error. Please try again.')
      setRegenerating(false)
    }
  }

  const phases: Phase[] = plan.raw_ai_output?.phases ?? []

  // Build a global task index across the entire plan (sorted by day_number)
  // so Task 1, Task 2… are consistent regardless of which phase/week you're viewing
  const allTasksSorted = [...initialTasks].sort((a, b) => a.day_number - b.day_number)
  const taskNumberMap = new Map(allTasksSorted.map((t, i) => [t.id, i + 1]))

  // ── Completion toggle ──────────────────────────────────────────────────────
  async function handleToggle(taskId: string, newValue: boolean) {
    // Capture state snapshot for revert and phase-check
    const prevTasks = tasks
    const nextTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: newValue } : t)
    setTasks(nextTasks)

    try {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: newValue }),
      })

      if (!res.ok) {
        setTasks(prevTasks) // revert optimistic update
      } else {
        const data = await res.json()

        // Update live points and show celebration
        if (typeof data.points_delta === 'number' && data.points_delta !== 0) {
          setTotalPoints(prev => Math.max(0, prev + data.points_delta))
          if (data.points_delta > 0) setCelebration({ points: data.points_delta })
        }

        // Check if this completion finished a phase (only on complete, not uncheck)
        if (newValue) {
          const toggledTask = prevTasks.find(t => t.id === taskId)
          if (toggledTask) {
            const phase = toggledTask.phase
            const phaseTasks = nextTasks.filter(t => t.phase === phase && !t.is_locked)
            const allDone = phaseTasks.length > 0 && phaseTasks.every(t => t.is_completed)

            if (allDone && !awardedPhasesRef.current.has(phase)) {
              awardedPhasesRef.current.add(phase) // block double-trigger immediately
              try {
                const phaseRes = await fetch('/api/rewards/phase-complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ planId: plan.id, phaseNumber: phase }),
                })
                if (phaseRes.ok) {
                  const pd = await phaseRes.json()
                  if (!pd.already_awarded && pd.bonus > 0) {
                    setTotalPoints(prev => prev + pd.bonus)
                    setPhaseComplete({ phase, bonus: pd.bonus })
                  }
                }
              } catch {
                awardedPhasesRef.current.delete(phase) // allow retry if network error
              }
            }
          }
        }
      }
    } catch {
      setTasks(prevTasks)
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const unlockedTasks = tasks.filter(t => !t.is_locked)
  const completedCount = unlockedTasks.filter(t => t.is_completed).length
  const completionPct = unlockedTasks.length > 0
    ? Math.round((completedCount / unlockedTasks.length) * 100)
    : 0

  // ── Phase tasks & week navigation ─────────────────────────────────────────
  const phaseTasks = tasks.filter(t => t.phase === activePhase)
  const weeks = Array.from(new Set(phaseTasks.map(t => t.week_number))).sort((a, b) => a - b)

  // All weeks across the full plan (for "Week X of 13" labelling)
  const allWeeks = Array.from(new Set(tasks.map(t => t.week_number))).sort((a, b) => a - b)
  const totalWeeks = allWeeks.length

  const activeWeekIndex = weeks.indexOf(activeWeek)

  // Cross-phase prev: if on first week of this phase, look at the previous phase
  const prevPhaseNum = activePhase - 1
  const prevPhaseTasks = tasks.filter(t => t.phase === prevPhaseNum)
  const prevPhaseWeeks = Array.from(new Set(prevPhaseTasks.map(t => t.week_number))).sort((a, b) => a - b)

  const isFirstWeekOfPhase = activeWeekIndex === 0
  const isLastWeekOfPhase  = activeWeekIndex === weeks.length - 1

  // Prev: either previous week in this phase, or last week of the previous phase
  const canGoPrev = activeWeekIndex > 0 || (isFirstWeekOfPhase && prevPhaseWeeks.length > 0)
  const prevWeekNum = canGoPrev
    ? (activeWeekIndex > 0 ? weeks[activeWeekIndex - 1] : prevPhaseWeeks[prevPhaseWeeks.length - 1])
    : null

  // Next: either next week in this phase, or first week of the next phase
  const nextPhaseNum = activePhase + 1
  const nextPhaseTasks = tasks.filter(t => t.phase === nextPhaseNum)
  const nextPhaseWeeks = Array.from(new Set(nextPhaseTasks.map(t => t.week_number))).sort((a, b) => a - b)

  const canGoNext = activeWeekIndex < weeks.length - 1 || (isLastWeekOfPhase && nextPhaseWeeks.length > 0)
  const nextWeekNum = canGoNext
    ? (activeWeekIndex < weeks.length - 1 ? weeks[activeWeekIndex + 1] : nextPhaseWeeks[0])
    : null

  function goToPrev() {
    setShowAddForm(false)
    if (activeWeekIndex > 0) {
      setActiveWeek(weeks[activeWeekIndex - 1])
    } else if (prevPhaseWeeks.length > 0) {
      setActivePhase(prevPhaseNum)
      setActiveWeek(prevPhaseWeeks[prevPhaseWeeks.length - 1])
    }
  }

  function goToNext() {
    setShowAddForm(false)
    if (activeWeekIndex < weeks.length - 1) {
      setActiveWeek(weeks[activeWeekIndex + 1])
    } else if (nextPhaseWeeks.length > 0) {
      setActivePhase(nextPhaseNum)
      setActiveWeek(nextPhaseWeeks[0])
    }
  }

  // Within-phase prev/next weeks (used by TaskMoveActions — cross-phase moves not allowed)
  const prevWeekInPhase = activeWeekIndex > 0 ? weeks[activeWeekIndex - 1] : null
  const nextWeekInPhase = activeWeekIndex < weeks.length - 1 ? weeks[activeWeekIndex + 1] : null

  // ── Task moved handler ─────────────────────────────────────────────────────
  function handleTaskMoved(taskId: string, newWeek: number, newDay: number) {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, week_number: newWeek, day_number: newDay } : t
    ))
  }

  // ── Task replaced handler ─────────────────────────────────────────────────
  function handleTaskReplaced(updatedTask: Task) {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
  }

  // ── Custom task added handler ──────────────────────────────────────────────
  function handleTaskAdded(newTask: Task) {
    setTasks(prev => [...prev, newTask])
    setShowAddForm(false)
  }

  // Tasks visible in the currently selected week
  const weekTasks = phaseTasks
    .filter(t => t.week_number === activeWeek)
    .sort((a, b) => a.day_number - b.day_number)

  // Count completed tasks in the active week (for the "all done" nudge)
  const weekCompletedCount = weekTasks.filter(t => !t.is_locked && t.is_completed).length
  const weekUnlockedCount  = weekTasks.filter(t => !t.is_locked).length
  const weekAllDone = weekUnlockedCount > 0 && weekCompletedCount === weekUnlockedCount

  return (
    <div>
      {/* Live points counter */}
      {totalPoints > 0 && (
        <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-gradient-to-r from-brand-accent/20 to-purple-50 border border-brand-accent/30 rounded-xl">
          <p className="text-xs text-gray-500 font-medium">Reward points earned</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-brand-coal">{totalPoints.toLocaleString()} pts</p>
            <Link href="/dashboard/rewards" className="text-xs text-brand-button font-semibold hover:opacity-75 transition-opacity">
              View →
            </Link>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-brand-coal">
            {completedCount} of {unlockedTasks.length} tasks complete
          </p>
          <p className="text-sm font-semibold text-brand-button">{completionPct}%</p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-button rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {tasks.some(t => t.is_locked) && (
          <p className="text-xs text-gray-400 mt-1.5">
            {userTier === 'author'
              ? <>This book&apos;s plan is locked past day 30. <span className="text-brand-button font-medium cursor-pointer hover:underline" onClick={() => setShowUpgradeModal(true)}>Upgrade to Launch Pro</span> to unlock all your books.</>
              : <>Showing tasks 1–30 days. <span className="text-brand-button font-medium cursor-pointer hover:underline" onClick={() => setShowUpgradeModal(true)}>Upgrade to Author</span> to unlock all 90 days.</>
            }
          </p>
        )}
      </div>

      {/* Regeneration banner — shown after time preference changes */}
      {timeChanged && (
        <div className="mb-5 bg-brand-accent/20 border border-brand-accent/40 rounded-xl px-4 py-3 space-y-3">
          {regenerating ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4 text-brand-button shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-brand-coal">Drafting your updated plan…</p>
                <p className="text-xs text-gray-500">This takes 1–2 minutes. You can navigate away and come back.</p>
              </div>
            </div>
          ) : confirmReset ? (
            /* Confirmation step for hard reset */
            <div>
              <p className="text-sm font-medium text-brand-coal mb-1">Are you sure?</p>
              <p className="text-xs text-gray-500 mb-3">
                This will permanently delete your {completedCount_total} completed task{completedCount_total !== 1 ? 's' : ''} and start completely fresh.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmReset(false)}
                  className="flex-1 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" onClick={() => handleRegenerate(true)}
                  className="flex-1 py-1.5 text-xs text-white bg-red-500 rounded-lg hover:opacity-90">
                  Yes, start fresh
                </button>
              </div>
            </div>
          ) : (
            /* Normal state — two options */
            <div>
              <p className="text-sm font-medium text-brand-coal">Time preference updated</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">
                Regenerate to get tasks matched to your new capacity.
                {completedCount_total > 0 && ` Your ${completedCount_total} completed task${completedCount_total !== 1 ? 's' : ''} will be carried over.`}
              </p>
              {regenError && <p className="text-xs text-red-500 mb-2">{regenError}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleRegenerate(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-button text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate — keep my progress
                </button>
                {completedCount_total > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors underline underline-offset-2"
                  >
                    Start completely fresh
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase tabs */}
      {phases.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {phases.map(phase => (
            <button
              key={phase.phase_number}
              type="button"
              onClick={() => { setActivePhase(phase.phase_number); setShowAddForm(false) }}
              className={`shrink-0 w-[130px] px-3 py-2.5 rounded-xl text-sm font-medium transition-all border text-center ${
                activePhase === phase.phase_number
                  ? 'bg-brand-button text-white border-brand-button'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-accent'
              }`}
            >
              Phase {phase.phase_number}
              <span className="block text-xs font-normal leading-snug mt-0.5">
                {phase.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Active phase description */}
      {phases[activePhase - 1] && (
        <div className="bg-brand-accent/20 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm font-semibold text-brand-coal">{phases[activePhase - 1].title}</p>
          <p className="text-xs text-gray-600 mt-0.5">{phases[activePhase - 1].description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Weeks {phases[activePhase - 1].week_start}–{phases[activePhase - 1].week_end}
          </p>
        </div>
      )}

      {/* Week navigator + tasks */}
      {phaseTasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tasks in this phase.</p>
      ) : (
        <div>
          {/* Week header row: prev/next + time stepper */}
          <WeekHeader
            weekNum={activeWeek}
            totalWeeks={totalWeeks}
            taskCount={weekTasks.length}
            bookId={bookId}
            currentTime={currentTime}
            onTimeSaved={handleTimeSaved}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            prevWeekNum={prevWeekNum}
            nextWeekNum={nextWeekNum}
            onPrev={goToPrev}
            onNext={goToNext}
            timeChanged={timeChanged}
            regenerating={regenerating}
            onRegenerate={() => handleRegenerate(false)}
          />

          {/* Task list for the active week */}
          <div className="space-y-2">
            {weekTasks.map(task => (
              <div key={task.id}>
                <TaskCard
                  task={task}
                  taskNumber={taskNumberMap.get(task.id) ?? 0}
                  onToggle={handleToggle}
                  onUpgradeClick={() => setShowUpgradeModal(true)}
                />
                <TaskMoveActions
                  task={task}
                  prevWeekInPhase={prevWeekInPhase}
                  nextWeekInPhase={nextWeekInPhase}
                  onMoved={handleTaskMoved}
                />
                <TaskReplaceAction
                  task={task}
                  onReplaced={handleTaskReplaced}
                />
              </div>
            ))}
          </div>

          {/* Add custom task */}
          {showAddForm ? (
            <AddTaskForm
              planId={plan.id}
              weekNumber={activeWeek}
              phase={activePhase}
              onAdd={handleTaskAdded}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-brand-button hover:text-brand-button transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add your own task
            </button>
          )}

          {/* "All done this week" nudge */}
          {weekAllDone && canGoNext && (
            <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-green-700">
                Week {activeWeek} complete! 🎉
              </p>
              <button
                type="button"
                onClick={goToNext}
                className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:opacity-80 transition-opacity"
              >
                Week {nextWeekNum}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} bookId={bookId} />
      )}

      {/* Task completion celebration */}
      {celebration && (
        <TaskCelebration
          points={celebration.points}
          onDone={() => setCelebration(null)}
        />
      )}

      {/* Phase completion modal */}
      {phaseComplete && (
        <PhaseCompleteModal
          phase={phaseComplete.phase}
          bonus={phaseComplete.bonus}
          onClose={() => setPhaseComplete(null)}
        />
      )}
    </div>
  )
}
