'use client'

import { useState, useEffect } from 'react'
// useRouter available if needed for future navigation
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

// ─── Main PlanView ─────────────────────────────────────────────────────────────

// ─── Helper: first week in a list that has an incomplete unlocked task ────────

function firstIncompleteWeek(weeksList: number[], tasksList: Task[]): number {
  const w = weeksList.find(wk =>
    tasksList.filter(t => t.week_number === wk && !t.is_locked).some(t => !t.is_completed)
  )
  return w ?? weeksList[0]
}

export default function PlanView({ plan, tasks: initialTasks, isStarterTier: _isStarterTier, userTier = 'starter', bookId, initialTimePerWeek = '3_5hrs' }: Props) {
  void _isStarterTier // retained in props for potential future use
  const [tasks, setTasks] = useState(initialTasks)
  const [activePhase, setActivePhase] = useState(plan.current_phase)
  const [currentTime, setCurrentTime] = useState(initialTimePerWeek)
  const [timeChanged, setTimeChanged] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // ── Active week — start on the first week with incomplete work ─────────────
  const [activeWeek, setActiveWeek] = useState(() => {
    const startTasks = initialTasks.filter(t => t.phase === plan.current_phase)
    const startWeeks = Array.from(new Set(startTasks.map(t => t.week_number))).sort((a, b) => a - b)
    return firstIncompleteWeek(startWeeks, startTasks)
  })

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
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: newValue } : t))
    try {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: newValue }),
      })
      if (!res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !newValue } : t))
      }
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !newValue } : t))
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
  const canGoPrev = activeWeekIndex > 0
  const canGoNext = activeWeekIndex < weeks.length - 1

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
              onClick={() => setActivePhase(phase.phase_number)}
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
            prevWeekNum={canGoPrev ? weeks[activeWeekIndex - 1] : null}
            nextWeekNum={canGoNext ? weeks[activeWeekIndex + 1] : null}
            onPrev={() => setActiveWeek(weeks[activeWeekIndex - 1])}
            onNext={() => setActiveWeek(weeks[activeWeekIndex + 1])}
            timeChanged={timeChanged}
            regenerating={regenerating}
            onRegenerate={() => handleRegenerate(false)}
          />

          {/* Task list for the active week */}
          <div className="space-y-2">
            {weekTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                taskNumber={taskNumberMap.get(task.id) ?? 0}
                onToggle={handleToggle}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            ))}
          </div>

          {/* "All done this week" nudge */}
          {weekAllDone && canGoNext && (
            <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-green-700">
                Week {activeWeek} complete! 🎉
              </p>
              <button
                type="button"
                onClick={() => setActiveWeek(weeks[activeWeekIndex + 1])}
                className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:opacity-80 transition-opacity"
              >
                Week {weeks[activeWeekIndex + 1]}
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
    </div>
  )
}
