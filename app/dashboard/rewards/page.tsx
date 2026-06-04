'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SignOutButton from '@/components/SignOutButton'
import BookFlip from '@/components/rewards/BookFlip'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  points: number
  is_current_user: boolean
  bonus_awarded: boolean
}

interface LeaderboardCategory {
  entries: LeaderboardEntry[]
  user_rank: { rank: number; points: number } | null
}

interface LeaderboardData {
  week_start: string
  fiction: LeaderboardCategory
  nonfiction: LeaderboardCategory
}

// ─── Leaderboard component ────────────────────────────────────────────────────

function LeaderboardTable({ data, category }: { data: LeaderboardCategory; category: string }) {
  if (data.entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">No activity yet this week.</p>
        <p className="text-xs text-gray-300 mt-1">Complete tasks to get on the board!</p>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div className="space-y-1.5">
        {data.entries.map(entry => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
              entry.is_current_user
                ? 'bg-brand-accent/30 border border-brand-accent/50'
                : 'bg-gray-50'
            }`}
          >
            <span className="text-base w-6 text-center flex-shrink-0">
              {entry.rank <= 3 ? medals[entry.rank - 1] : <span className="text-xs text-gray-400 font-medium">#{entry.rank}</span>}
            </span>
            <p className={`flex-1 text-sm font-medium truncate ${entry.is_current_user ? 'text-brand-button' : 'text-gray-800'}`}>
              {entry.display_name}{entry.is_current_user ? ' (you)' : ''}
            </p>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-brand-coal">{entry.points.toLocaleString()}</p>
              <p className="text-xs text-gray-400">pts</p>
            </div>
            {entry.rank <= 3 && !entry.bonus_awarded && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 border ${
                entry.rank === 1 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                entry.rank === 2 ? 'text-slate-500 bg-slate-50 border-slate-200' :
                                   'text-orange-600 bg-orange-50 border-orange-200'
              }`}>
                {entry.rank === 1 ? '🥇 Gold' : entry.rank === 2 ? '🥈 Silver' : '🥉 Bronze'}
              </span>
            )}
            {entry.rank <= 3 && entry.bonus_awarded && (
              <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {entry.rank === 1 ? '+200' : entry.rank === 2 ? '+100' : '+50'} ✓
              </span>
            )}
          </div>
        ))}
      </div>

      {/* User rank if outside top 10 */}
      {data.user_rank && !data.entries.some(e => e.is_current_user) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-brand-accent/20 border border-brand-accent/40">
            <span className="text-xs text-gray-400 font-medium w-6 text-center">#{data.user_rank.rank}</span>
            <p className="flex-1 text-sm font-medium text-brand-button">You</p>
            <p className="text-sm font-bold text-brand-coal">{data.user_rank.points.toLocaleString()} pts</p>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">
            {data.entries[0] ? `${(data.entries[0].points - data.user_rank.points).toLocaleString()} pts behind #1` : ''}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        🥇 Gold +200 pts &nbsp;·&nbsp; 🥈 Silver +100 pts &nbsp;·&nbsp; 🥉 Bronze +50 pts · awarded at week end
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [totalPoints, setTotalPoints] = useState(0)
  const [isPaidUser, setIsPaidUser] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [spinsRemaining, setSpinsRemaining] = useState(0)
  const [spinsLimit, setSpinsLimit] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [activeTab, setActiveTab] = useState<'fiction' | 'nonfiction'>('fiction')
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [profileRes, lbRes] = await Promise.all([
        fetch('/api/auth/profile'),
        fetch('/api/rewards/leaderboard'),
      ])

      if (profileRes.ok) {
        const profile = await profileRes.json()
        setTotalPoints(profile.total_points ?? 0)
        setIsPaidUser(profile.tier === 'author' || profile.tier === 'pro')
        setSpinsRemaining(profile.spins_remaining ?? 0)
        setSpinsLimit(profile.spins_limit ?? 0)
      }
      setProfileLoaded(true)

      if (lbRes.ok) {
        const lb = await lbRes.json()
        setLeaderboard(lb)
        setWeekStart(lb.week_start)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleSpinComplete(_prize: string, _code: string | null, newTotal: number) {
    setTotalPoints(newTotal)
    setSpinsRemaining(prev => Math.max(0, prev - 1))
  }

  // Format week_start as "Jun 1 – Jun 7"
  function formatWeekRange(start: string) {
    if (!start) return ''
    const s = new Date(start + 'T00:00:00')
    const e = new Date(s)
    e.setDate(e.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(s)} – ${fmt(e)}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="forword.io" width={120} height={34} />
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors">
              Your plans
            </Link>
            <Link href="/dashboard/rewards" className="text-sm text-brand-button font-semibold">
              Rewards
            </Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors">
              Account settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Header + total points */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-coal">Rewards</h1>
          <p className="text-gray-500 text-sm mt-1">Earn points by completing tasks. Spend them to flip the book.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-brand-button" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Points balance card */}
            <div className="bg-gradient-to-br from-brand-button to-purple-700 rounded-2xl p-6 text-white">
              <p className="text-sm font-medium text-white/70 mb-1">Your total points</p>
              <p className="text-5xl font-bold tracking-tight">{totalPoints.toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
                <span>Planning tasks · 75 pts</span>
                <span>Social · 100 pts</span>
                <span>PR · 150 pts</span>
                <span>Email · 100 pts</span>
                <span>Publishing · 150 pts</span>
              </div>
            </div>

            {/* Flip the Book */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-brand-coal">Flip the Book</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Spend 2,500 points for a chance to win a reward
                </p>
              </div>
              <BookFlip
                totalPoints={totalPoints}
                isPaidUser={isPaidUser}
                profileLoaded={profileLoaded}
                spinsRemaining={spinsRemaining}
                spinsLimit={spinsLimit}
                onSpinComplete={handleSpinComplete}
              />
            </div>

            {/* Prize pool reference */}
            <div className="rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-brand-coal mb-3">Prize pool</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  '$1 off your next month',
                  '$2 off your next month',
                  '10% off at ForWord Writers Etsy shop',
                  '1 free month of Author',
                  '50% off Launch Pro for one month',
                ].map(prize => (
                  <div key={prize} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-brand-button text-xs">✦</span>
                    <p className="text-sm text-gray-700">{prize}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Prizes are applied manually by the forword.io team within 2–3 business days of winning.
              </p>
            </div>

            {/* Weekly Leaderboard */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-brand-coal">Weekly Leaderboard</h2>
                  {weekStart && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatWeekRange(weekStart)} · Resets Sunday midnight ET
                    </p>
                  )}
                </div>
                <span className="text-xs text-brand-button font-semibold bg-brand-accent/30 px-2.5 py-1 rounded-full">
                  🥇+200 🥈+100 🥉+50
                </span>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {(['fiction', 'nonfiction'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-brand-button border-b-2 border-brand-button bg-brand-accent/10'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {leaderboard && (
                  <LeaderboardTable
                    data={leaderboard[activeTab]}
                    category={activeTab}
                  />
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
