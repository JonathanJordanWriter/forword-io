'use client'

import { useState, useRef } from 'react'

// ─── Option sets (mirrors onboarding) ────────────────────────────────────────

const BOOK_TYPES = ['fiction', 'nonfiction']
const BOOK_TYPE_LABELS: Record<string, string> = {
  fiction: 'Fiction',
  nonfiction: 'Nonfiction',
}

const PUBLISHING_PATHS = [
  { value: 'self', label: 'Self-published' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'undecided', label: 'Undecided' },
]

const TIMEFRAMES = [
  { value: 'within_12mo', label: 'Within 12 months' },
  { value: '12_18mo', label: '12–18 months' },
  { value: '1_2yr', label: '1–2 years' },
  { value: '2yr_plus', label: '2+ years' },
  { value: 'already_published', label: 'Already published' },
]

const BOOK_STAGES = [
  { value: 'idea', label: 'Just an idea' },
  { value: 'still_writing', label: 'Still writing' },
  { value: 'finished_manuscript', label: 'Finished manuscript' },
  { value: 'beta_reading', label: 'Beta reading' },
  { value: 'revision', label: 'In revision' },
  { value: 'editing', label: 'Editing' },
  { value: 'cover_design', label: 'Cover & production' },
  { value: 'published', label: 'Published' },
]

const GOALS = [
  { value: 'build_readership', label: 'Build my readership' },
  { value: 'sell_copies', label: 'Sell more copies' },
  { value: 'attract_agent', label: 'Attract a literary agent' },
  { value: 'relaunch', label: 'Relaunch backlist' },
  { value: 'audiobook', label: 'Market an audiobook' },
]

const PLATFORMS_LIST = [
  'Instagram', 'TikTok / BookTok', 'Substack', 'Facebook', 'Goodreads',
  'Threads', 'YouTube', 'Pinterest', 'LinkedIn', 'Twitter / X', 'Podcast guest appearances',
]

const TIME_OPTIONS = [
  { value: '1_2hrs', label: '1–2 hrs / week' },
  { value: '3_5hrs', label: '3–5 hrs / week' },
  { value: '6_10hrs', label: '6–10 hrs / week' },
]

const BUDGET_OPTIONS = [
  { value: '0_50', label: '$0–$50 / month' },
  { value: '50_200', label: '$50–$200 / month' },
  { value: '200_plus', label: '$200+ / month' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'first_time', label: 'First-time author' },
  { value: 'mid_career', label: 'Mid-career' },
  { value: 'established', label: 'Established' },
]

const AUDIENCE_OPTIONS = [
  { value: 'under_500', label: 'Under 500' },
  { value: '500_2k', label: '500–2k' },
  { value: '2k_10k', label: '2k–10k' },
  { value: '10k_plus', label: '10k+' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookProfile {
  book_type?: string
  genres?: string[]
  subgenre?: string
  publishing_path?: string
  book_stage?: string
  launch_timeframe?: string
  goals_ranked?: string[]
  platforms?: { active: string[]; open_to: string[] }
  time_per_week?: string
  monthly_budget?: string
  experience_level?: string
  existing_audience?: string
}

interface Props {
  bookId: string
  book: BookProfile
  defaultCollapsed?: boolean
}

// ─── Chip selector helper ─────────────────────────────────────────────────────

function ChipGroup({
  options, value, onChange, multi = false,
}: {
  options: { value: string; label: string }[]
  value: string | string[]
  onChange: (val: string | string[]) => void
  multi?: boolean
}) {
  function toggle(v: string) {
    if (!multi) {
      onChange(v)
    } else {
      const arr = (value as string[]) ?? []
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
    }
  }
  const selected = multi ? (value as string[]) : [value as string]

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-all ${
            selected.includes(opt.value)
              ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
              : 'border-gray-200 text-gray-600 hover:border-brand-accent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EditableBookProfile({ bookId, book, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Local edit state — initialised from book prop
  const [bookType, setBookType] = useState(book.book_type ?? '')
  const [genres, setGenres] = useState<string[]>(book.genres ?? [])
  const [subgenre, setSubgenre] = useState(book.subgenre ?? '')
  const [publishingPath, setPublishingPath] = useState(book.publishing_path ?? '')
  const [bookStage, setBookStage] = useState(book.book_stage ?? '')
  const [launchTimeframe, setLaunchTimeframe] = useState(book.launch_timeframe ?? '')
  const [goalsRanked, setGoalsRanked] = useState<string[]>(book.goals_ranked ?? [])
  const [activePlatforms, setActivePlatforms] = useState<string[]>(book.platforms?.active ?? [])
  const [openToPlatforms, setOpenToPlatforms] = useState<string[]>(book.platforms?.open_to ?? [])
  const [timePerWeek, setTimePerWeek] = useState(book.time_per_week ?? '')
  // Track the last-saved time so we can detect a change after the user edits
  const savedTimePerWeek = useRef(book.time_per_week ?? '')
  const [monthlyBudget, setMonthlyBudget] = useState(book.monthly_budget ?? '')
  const [experienceLevel, setExperienceLevel] = useState(book.experience_level ?? '')
  const [existingAudience, setExistingAudience] = useState(book.existing_audience ?? '')

  function toggleGoal(goal: string) {
    if (goalsRanked.includes(goal)) {
      setGoalsRanked(prev => prev.filter(g => g !== goal))
    } else if (goalsRanked.length < 3) {
      setGoalsRanked(prev => [...prev, goal])
    }
  }

  function toggleActivePlatform(p: string) {
    setActivePlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
    setOpenToPlatforms(prev => prev.filter(x => x !== p))
  }

  function toggleOpenToPlatform(p: string) {
    setOpenToPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
    setActivePlatforms(prev => prev.filter(x => x !== p))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/books/${bookId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_type: bookType || null,
          genres: genres.length ? genres : null,
          genre: genres[0] ?? null,
          subgenre: subgenre || null,
          publishing_path: publishingPath || null,
          book_stage: bookStage || null,
          launch_timeframe: launchTimeframe || null,
          goals_ranked: goalsRanked.length ? goalsRanked : null,
          primary_goal: goalsRanked[0] ?? null,
          platforms: { active: activePlatforms, open_to: openToPlatforms },
          time_per_week: timePerWeek || null,
          monthly_budget: monthlyBudget || null,
          experience_level: experienceLevel || null,
          existing_audience: existingAudience || null,
        }),
      })
      if (!res.ok) { setSaveError('Failed to save — please try again'); return }

      // If time_per_week changed, flag that the plan needs regeneration.
      // sessionStorage persists through refreshes; the custom event updates
      // PlanView immediately when both components are on the same page.
      if (timePerWeek !== savedTimePerWeek.current) {
        const storageKey = `plan-needs-regen-${bookId}`
        sessionStorage.setItem(storageKey, '1')
        window.dispatchEvent(new CustomEvent('plan-needs-regen'))
        savedTimePerWeek.current = timePerWeek
      }

      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  // ── Display rows (read view) ───────────────────────────────────────────────
  const GOAL_LABELS: Record<string, string> = Object.fromEntries(GOALS.map(g => [g.value, g.label]))
  const TIMEFRAME_LABELS: Record<string, string> = Object.fromEntries(TIMEFRAMES.map(t => [t.value, t.label]))

  const displayRows = [
    { label: 'Book type', value: BOOK_TYPE_LABELS[bookType] ?? bookType },
    { label: 'Genre(s)', value: genres.join(', ') || null },
    { label: 'Keywords', value: subgenre || null },
    { label: 'Publishing path', value: PUBLISHING_PATHS.find(p => p.value === publishingPath)?.label ?? publishingPath },
    { label: 'Book stage', value: BOOK_STAGES.find(s => s.value === bookStage)?.label ?? bookStage },
    { label: 'Launch timeframe', value: TIMEFRAME_LABELS[launchTimeframe] ?? null },
    { label: 'Goals (ranked)', value: goalsRanked.map((g, i) => `${i + 1}. ${GOAL_LABELS[g] ?? g}`).join('  ·  ') || null },
    { label: 'Active platforms', value: activePlatforms.join(', ') || null },
    { label: 'Exploring', value: openToPlatforms.join(', ') || null },
    { label: 'Time per week', value: TIME_OPTIONS.find(t => t.value === timePerWeek)?.label ?? null },
    { label: 'Monthly budget', value: BUDGET_OPTIONS.find(b => b.value === monthlyBudget)?.label ?? null },
    { label: 'Experience level', value: EXPERIENCE_OPTIONS.find(e => e.value === experienceLevel)?.label ?? null },
    { label: 'Existing audience', value: AUDIENCE_OPTIONS.find(a => a.value === existingAudience)?.label ?? null },
  ].filter(row => row.value)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => { setCollapsed(c => !c); if (editing) setEditing(false) }}
          className="flex items-center gap-2 group"
        >
          <h2 className="text-base font-semibold text-brand-coal group-hover:text-brand-button transition-colors">
            Book profile
          </h2>
          <span className="text-xs text-brand-button font-medium group-hover:opacity-70 transition-opacity">
            {collapsed ? 'View profile' : 'Hide'}
          </span>
          <svg
            className={`w-4 h-4 text-brand-button transition-all ${collapsed ? '-rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {!collapsed && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-brand-button hover:opacity-80 transition-opacity font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit profile
          </button>
        )}
        {saved && <p className="text-xs text-green-600 font-medium">✓ Profile saved</p>}
      </div>

      {!collapsed && editing ? (
        // ── Edit form ────────────────────────────────────────────────────────
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-5">

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Book type</p>
            <ChipGroup
              options={BOOK_TYPES.map(v => ({ value: v, label: BOOK_TYPE_LABELS[v] }))}
              value={bookType}
              onChange={v => { setBookType(v as string); setGenres([]) }}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Keywords / subgenre</p>
            <input
              type="text"
              value={subgenre}
              onChange={e => setSubgenre(e.target.value)}
              placeholder="e.g. slow burn, dark academia, financial literacy…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Publishing path</p>
            <ChipGroup
              options={PUBLISHING_PATHS}
              value={publishingPath}
              onChange={v => setPublishingPath(v as string)}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Book stage</p>
            <ChipGroup
              options={BOOK_STAGES}
              value={bookStage}
              onChange={v => setBookStage(v as string)}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Launch timeframe</p>
            <ChipGroup
              options={TIMEFRAMES}
              value={launchTimeframe}
              onChange={v => setLaunchTimeframe(v as string)}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Goals <span className="text-gray-400 font-normal">(tap to rank up to 3)</span>
            </p>
            {goalsRanked.length > 0 && (
              <p className="text-xs text-brand-button mb-2">
                {goalsRanked.map((g, i) => `${i + 1}. ${GOAL_LABELS[g] ?? g}`).join('  ·  ')}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map(goal => {
                const rank = goalsRanked.indexOf(goal.value)
                const isRanked = rank !== -1
                const atMax = goalsRanked.length >= 3 && !isRanked
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => toggleGoal(goal.value)}
                    disabled={atMax}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all ${
                      isRanked
                        ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                        : atMax
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:border-brand-accent'
                    }`}
                  >
                    {isRanked && (
                      <span className="w-4 h-4 rounded-full bg-brand-button text-white text-[10px] font-bold flex items-center justify-center">
                        {rank + 1}
                      </span>
                    )}
                    {goal.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Active platforms</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS_LIST.map(p => (
                <button key={p} type="button" onClick={() => toggleActivePlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    activePlatforms.includes(p)
                      ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-brand-accent'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Open to exploring</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS_LIST.filter(p => !activePlatforms.includes(p)).map(p => (
                <button key={p} type="button" onClick={() => toggleOpenToPlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    openToPlatforms.includes(p)
                      ? 'border-brand-accent bg-brand-accent/20 text-brand-blue font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-brand-accent'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Time per week</p>
            <ChipGroup options={TIME_OPTIONS} value={timePerWeek} onChange={v => setTimePerWeek(v as string)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Monthly budget</p>
            <ChipGroup options={BUDGET_OPTIONS} value={monthlyBudget} onChange={v => setMonthlyBudget(v as string)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Experience level</p>
            <ChipGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={v => setExperienceLevel(v as string)} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Existing audience size</p>
            <ChipGroup options={AUDIENCE_OPTIONS} value={existingAudience} onChange={v => setExistingAudience(v as string)} />
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditing(false)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-brand-button text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      ) : !collapsed ? (
        // ── Read view ────────────────────────────────────────────────────────
        <div className="bg-gray-50 rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {displayRows.map(row => (
            <div key={row.label} className="flex items-start justify-between px-5 py-3">
              <p className="text-xs text-gray-400 w-36 shrink-0">{row.label}</p>
              <p className="text-sm text-gray-800 text-right">{row.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
