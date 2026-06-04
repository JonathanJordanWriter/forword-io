'use client'

import { useState } from 'react'
import Link from 'next/link'

const SPIN_COST = 2500

interface Props {
  totalPoints: number
  isPaidUser: boolean
  onSpinComplete: (prize: string, code: string | null, newTotal: number) => void
}

export default function BookFlip({ totalPoints, isPaidUser, onSpinComplete }: Props) {
  const [phase, setPhase] = useState<'idle' | 'flipping' | 'result'>('idle')
  const [prize, setPrize] = useState<string | null>(null)
  const [prizeCode, setPrizeCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSpin = isPaidUser && totalPoints >= SPIN_COST

  async function handleFlip() {
    if (!canSpin || phase !== 'idle') return
    setPhase('flipping')
    setError(null)
    setPrize(null)
    setPrizeCode(null)

    try {
      const res = await fetch('/api/rewards/spin', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setPhase('idle')
        return
      }

      // Let the animation run for 3 seconds before revealing
      await new Promise(r => setTimeout(r, 3000))
      setPrize(data.prize)
      setPrizeCode(data.prize_code ?? null)
      setPhase('result')
      onSpinComplete(data.prize, data.prize_code ?? null, data.points_remaining)
    } catch {
      setError('Network error. Please try again.')
      setPhase('idle')
    }
  }

  function handleReset() {
    setPhase('idle')
    setPrize(null)
    setPrizeCode(null)
  }

  return (
    <div className="flex flex-col items-center">
      {/* Book illustration */}
      <div className="relative mb-6" style={{ perspective: '600px' }}>
        {phase === 'flipping' ? (
          // Animated open book with flipping pages
          <div className="book-bounce flex items-end justify-center gap-0.5">
            {/* Left cover */}
            <div
              className="w-16 h-20 rounded-l-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '-2px 2px 8px rgba(0,0,0,0.2)' }}
            >
              <div className="w-1 h-12 bg-white/20 rounded-full" />
            </div>
            {/* Spine */}
            <div className="w-2 h-20 bg-purple-900 flex-shrink-0" style={{ boxShadow: 'inset 0 0 4px rgba(0,0,0,0.4)' }} />
            {/* Flipping pages — stack of animated divs */}
            <div className="relative w-16 h-20" style={{ transformStyle: 'preserve-3d' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-r-sm"
                  style={{
                    background: i % 2 === 0 ? '#f8f7f4' : '#fffef9',
                    animationDelay: `${i * 0.08}s`,
                    transformOrigin: 'left center',
                    animation: `pageFlipRight ${0.4 + i * 0.05}s ease-in-out ${i * 0.08}s infinite alternate`,
                    boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Page lines */}
                  <div className="p-2 space-y-1.5 pt-3">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-0.5 rounded-full bg-gray-200" style={{ width: `${60 + (j % 3) * 15}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Right cover */}
            <div
              className="w-16 h-20 rounded-r-md"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '2px 2px 8px rgba(0,0,0,0.2)' }}
            />
          </div>
        ) : (
          // Static open book (idle or result state)
          <div className="flex items-end justify-center gap-0.5">
            {/* Left page */}
            <div
              className="w-16 h-20 rounded-l-md flex flex-col justify-between p-2 pt-3"
              style={{ background: '#f8f7f4', boxShadow: '-2px 2px 8px rgba(0,0,0,0.12)' }}
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-0.5 rounded-full bg-gray-300" style={{ width: `${55 + (i % 3) * 15}%` }} />
              ))}
            </div>
            {/* Spine */}
            <div className="w-2 h-20 flex-shrink-0" style={{ background: '#4f46e5', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)' }} />
            {/* Right page */}
            <div
              className="w-16 h-20 rounded-r-md flex flex-col justify-between p-2 pt-3"
              style={{ background: '#fffef9', boxShadow: '2px 2px 8px rgba(0,0,0,0.12)' }}
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-0.5 rounded-full bg-gray-300" style={{ width: `${60 + (i % 2) * 20}%` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Prize result */}
      {phase === 'result' && prize && (
        <div className="mb-5 bg-brand-accent/20 border border-brand-accent rounded-2xl px-6 py-4 text-center max-w-xs">
          <p className="text-lg font-bold text-brand-coal mb-1">🎉 You won!</p>
          <p className="text-base font-semibold text-brand-button">{prize}</p>
          {prizeCode && (
            <div className="mt-2 bg-white border border-brand-accent rounded-lg px-3 py-1.5">
              <p className="text-xs text-gray-500 mb-0.5">Use code at checkout</p>
              <p className="text-sm font-mono font-bold text-brand-coal tracking-widest">{prizeCode}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Our team will be in touch to apply your reward.</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
      )}

      {/* CTA area */}
      {!isPaidUser ? (
        <div className="text-center">
          <div className="opacity-40 pointer-events-none mb-3 select-none text-sm text-gray-500">
            Flip the Book costs 2,500 points
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-block px-6 py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Upgrade to win rewards
          </Link>
        </div>
      ) : phase === 'result' ? (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-brand-button font-medium hover:opacity-75 transition-opacity"
        >
          Flip again next time
        </button>
      ) : (
        <div className="text-center">
          <button
            type="button"
            onClick={handleFlip}
            disabled={!canSpin || phase === 'flipping'}
            className="px-8 py-3 bg-brand-button text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {phase === 'flipping' ? 'Flipping…' : 'Flip the Book'}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            {totalPoints >= SPIN_COST
              ? `Costs 2,500 points · you have ${totalPoints.toLocaleString()}`
              : `${(SPIN_COST - totalPoints).toLocaleString()} more points needed`}
          </p>
        </div>
      )}
    </div>
  )
}
