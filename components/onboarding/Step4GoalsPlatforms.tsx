'use client'

import { useState } from 'react'
import { OnboardingData, PrimaryGoal } from '@/lib/types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const GOALS: { value: PrimaryGoal; label: string; description: string }[] = [
  { value: 'build_readership', label: 'Build my readership', description: 'Grow an audience before or after launch' },
  { value: 'sell_copies', label: 'Sell more copies', description: 'Drive direct book sales' },
  { value: 'attract_agent', label: 'Attract a literary agent', description: 'Build platform to support a query' },
  { value: 'relaunch', label: 'Relaunch a backlist title', description: 'Revive interest in an existing book' },
  { value: 'audiobook', label: 'Market an audiobook', description: 'Promote a new audio edition' },
]

const AGE_RANGES = ['Under 18', '18–25', '26–35', '36–45', '46–55', '55+']

const FICTION_INTERESTS = [
  'Book clubs', 'Cozy reads', 'Dark fiction', 'Fast-paced plots', 'Character-driven',
  'Strong female leads', 'LGBTQ+ stories', 'Own voices', 'Historical settings',
  'Romantasy', 'Book series', 'Literary fiction', 'Debut authors',
  'Clean romance', 'Religious fiction',
]

const NONFICTION_INTERESTS = [
  'Entrepreneurship', 'Public speaking', 'Personal finance', 'Leadership',
  'Productivity', 'Career development', 'Wellness & self-care', 'Mindfulness',
  'Parenting', 'Faith & spirituality', 'DIY & crafts', 'Food & cooking',
  'Travel', 'History', 'True crime', 'Science & nature',
]

const PLATFORMS = [
  'Instagram', 'TikTok / BookTok', 'Substack', 'Facebook', 'Goodreads',
  'Threads', 'YouTube', 'Pinterest', 'LinkedIn', 'Twitter / X', 'Bluesky', 'Podcast guest appearances',
]

export default function Step4GoalsPlatforms({ data, onChange, onNext, onBack }: Props) {
  const [customInterest, setCustomInterest] = useState('')

  const isNonfiction = data.book_type === 'nonfiction'
  const presetInterests = isNonfiction ? NONFICTION_INTERESTS : FICTION_INTERESTS

  // Interests that were typed in manually (not in the preset list)
  const customInterests = data.ideal_reader.interests.filter(i => !presetInterests.includes(i))

  // --- Ranked goals logic ---
  function handleGoalClick(goal: PrimaryGoal) {
    const current = data.goals_ranked
    if (current.includes(goal)) {
      onChange({ goals_ranked: current.filter(g => g !== goal) })
    } else if (current.length < 3) {
      onChange({ goals_ranked: [...current, goal] })
    }
  }

  function getRank(goal: PrimaryGoal): number | null {
    const idx = data.goals_ranked.indexOf(goal)
    return idx === -1 ? null : idx + 1
  }

  // --- Interest toggles ---
  function toggleInterest(interest: string) {
    const current = data.ideal_reader.interests
    const next = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest]
    onChange({ ideal_reader: { ...data.ideal_reader, interests: next } })
  }

  function addCustomInterest() {
    const trimmed = customInterest.trim()
    if (!trimmed || data.ideal_reader.interests.includes(trimmed)) return
    onChange({ ideal_reader: { ...data.ideal_reader, interests: [...data.ideal_reader.interests, trimmed] } })
    setCustomInterest('')
  }

  function removeCustomInterest(interest: string) {
    onChange({
      ideal_reader: {
        ...data.ideal_reader,
        interests: data.ideal_reader.interests.filter(i => i !== interest),
      },
    })
  }

  // --- Ranked platform logic ---
  function handleActivePlatformClick(platform: string) {
    const current = data.platforms.active
    if (current.includes(platform)) {
      onChange({ platforms: { ...data.platforms, active: current.filter(p => p !== platform) } })
    } else {
      onChange({ platforms: { ...data.platforms, active: [...current, platform], open_to: data.platforms.open_to.filter(p => p !== platform) } })
    }
  }

  function getActivePlatformRank(platform: string): number | null {
    const idx = data.platforms.active.indexOf(platform)
    return idx === -1 ? null : idx + 1
  }

  function handleOpenToPlatformClick(platform: string) {
    const current = data.platforms.open_to
    if (current.includes(platform)) {
      onChange({ platforms: { ...data.platforms, open_to: current.filter(p => p !== platform) } })
    } else {
      onChange({ platforms: { ...data.platforms, open_to: [...current, platform], active: data.platforms.active.filter(p => p !== platform) } })
    }
  }

  function getOpenToPlatformRank(platform: string): number | null {
    const idx = data.platforms.open_to.indexOf(platform)
    return idx === -1 ? null : idx + 1
  }

  function toggleAgeRange(range: string) {
    const current = data.ideal_reader.age_ranges
    const next = current.includes(range) ? current.filter(r => r !== range) : [...current, range]
    onChange({ ideal_reader: { ...data.ideal_reader, age_ranges: next } })
  }

  const canProceed = data.goals_ranked.length >= 1

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">Goals, reader & platforms</h2>
      <p className="text-gray-500 text-sm mb-6">
        Rank your top goals and tell us who you&apos;re writing for.
      </p>

      {/* Ranked goals */}
      <p className="text-sm font-medium text-gray-700 mb-1">
        Rank your top goals{' '}
        <span className="text-gray-400 font-normal">(tap to rank up to 3, in order of priority)</span>
      </p>
      {data.goals_ranked.length > 0 && (
        <p className="text-xs text-brand-blue mb-2">
          {data.goals_ranked.map((g, i) => `${i + 1}. ${GOALS.find(x => x.value === g)?.label}`).join('  ·  ')}
        </p>
      )}
      <div className="space-y-2 mb-6">
        {GOALS.map(goal => {
          const rank = getRank(goal.value)
          const isRanked = rank !== null
          const atMax = data.goals_ranked.length >= 3 && !isRanked
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => handleGoalClick(goal.value)}
              disabled={atMax}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                isRanked
                  ? 'border-brand-button bg-brand-accent/20'
                  : atMax
                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-brand-accent bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{goal.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
                </div>
                {isRanked && (
                  <span className="ml-3 shrink-0 w-7 h-7 rounded-full bg-brand-button text-white text-xs font-bold flex items-center justify-center">
                    {rank}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Ideal reader age */}
      <p className="text-sm font-medium text-gray-700 mb-2">
        Ideal reader age <span className="text-gray-400 font-normal">(select all that fit)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {AGE_RANGES.map(range => (
          <button key={range} type="button" onClick={() => toggleAgeRange(range)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              data.ideal_reader.age_ranges.includes(range)
                ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                : 'border-gray-200 text-gray-600 hover:border-brand-accent'
            }`}>
            {range}
          </button>
        ))}
      </div>

      {/* Reader interests — preset chips (context-aware) */}
      <p className="text-sm font-medium text-gray-700 mb-2">
        Reader interests <span className="text-gray-400 font-normal">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {presetInterests.map(interest => (
          <button key={interest} type="button" onClick={() => toggleInterest(interest)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              data.ideal_reader.interests.includes(interest)
                ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                : 'border-gray-200 text-gray-600 hover:border-brand-accent'
            }`}>
            {interest}
          </button>
        ))}
      </div>

      {/* Custom interest chips (user-added) */}
      {customInterests.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {customInterests.map(interest => (
            <span key={interest}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-brand-button bg-brand-accent/30 text-brand-button font-medium">
              {interest}
              <button type="button" onClick={() => removeCustomInterest(interest)}
                className="ml-1 text-brand-button hover:text-red-500 leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom interest */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={customInterest}
          onChange={e => setCustomInterest(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
          placeholder={isNonfiction ? 'Add your own, e.g. financial literacy…' : 'Add your own, e.g. cozy mysteries…'}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button"
        />
        <button type="button" onClick={addCustomInterest}
          disabled={!customInterest.trim()}
          className="px-4 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          Add
        </button>
      </div>

      {/* Active platforms — ranked */}
      <p className="text-sm font-medium text-gray-700 mb-1">Platforms you&apos;re active on</p>
      <p className="text-xs text-gray-400 mb-2">Tap to rank in order of preference — your plan prioritizes the top-ranked platforms.</p>
      {data.platforms.active.length > 0 && (
        <p className="text-xs text-brand-blue mb-2">
          {data.platforms.active.map((p, i) => `${i + 1}. ${p}`).join('  ·  ')}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-5">
        {PLATFORMS.map(platform => {
          const rank = getActivePlatformRank(platform)
          const isRanked = rank !== null
          return (
            <button key={platform} type="button" onClick={() => handleActivePlatformClick(platform)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                isRanked
                  ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-brand-accent'
              }`}>
              {isRanked && (
                <span className="w-4 h-4 rounded-full bg-brand-button text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {rank}
                </span>
              )}
              {platform}
            </button>
          )
        })}
      </div>

      {/* Open to exploring platforms — ranked */}
      <p className="text-sm font-medium text-gray-700 mb-1">Platforms you&apos;re open to exploring</p>
      <p className="text-xs text-gray-400 mb-2">
        Tap to rank — we&apos;ll include beginner tasks for these, prioritized by your order.
      </p>
      {data.platforms.open_to.length > 0 && (
        <p className="text-xs text-brand-blue mb-2">
          {data.platforms.open_to.map((p, i) => `${i + 1}. ${p}`).join('  ·  ')}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-6">
        {PLATFORMS.filter(p => !data.platforms.active.includes(p)).map(platform => {
          const rank = getOpenToPlatformRank(platform)
          const isRanked = rank !== null
          return (
            <button key={platform} type="button" onClick={() => handleOpenToPlatformClick(platform)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                isRanked
                  ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-brand-accent'
              }`}>
              {isRanked && (
                <span className="w-4 h-4 rounded-full bg-brand-button text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {rank}
                </span>
              )}
              {platform}
            </button>
          )
        })}
        {PLATFORMS.filter(p => !data.platforms.active.includes(p)).length === 0 && (
          <p className="text-xs text-gray-400">All platforms are already marked as active.</p>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onBack}
          className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!canProceed}
          className="flex-1 py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          Continue
        </button>
      </div>
    </div>
  )
}
