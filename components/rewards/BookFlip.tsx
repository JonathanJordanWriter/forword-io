'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const SPIN_COST = 2500

// ── Book geometry constants ───────────────────────────────────────────────────
// Based on a real 6×9 inch book cover. Open book = 13×9 inches (6+1+6).
// Scaled to a display height of 270px → page width = 270 × (6/9) = 180px,
// spine width = 270 × (1/9) = 30px, total open width = 390px.
const BOOK_H  = 270   // 9 inches scaled
const PAGE_W  = 180   // 6 inches scaled
const SPINE_W = 30    // 1 inch scaled
const BOOK_W  = PAGE_W * 2 + SPINE_W  // 390px — correct 13:9 open-book ratio

interface Props {
  totalPoints: number
  isPaidUser: boolean
  profileLoaded: boolean
  spinsRemaining: number
  spinsLimit: number
  onSpinComplete: (prize: string, code: string | null, newTotal: number, spinsLeft: number) => void
}

// ── Helper: ruled page lines ──────────────────────────────────────────────────

function PageLines({ count = 11 }: { count?: number }) {
  return (
    <div style={{ padding: '22px 14px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            height: 1,
            background: 'rgba(0,0,0,0.09)',
            width: i === count - 1 ? '50%' : i === 0 ? '70%' : '100%',
          }}
        />
      ))}
    </div>
  )
}

// ── ClosedBook ────────────────────────────────────────────────────────────────
// Shown before the user clicks. Styled to look like a thick hardcover from a
// slight 3-quarter angle so the spine and page edges are visible.

function ClosedBook({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: PAGE_W + SPINE_W + 12,
        height: BOOK_H,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        // 3D tilt to show spine + page edges
        transform: 'perspective(900px) rotateX(-6deg) rotateY(-22deg)',
        transition: 'transform 0.25s ease',
        filter: 'drop-shadow(0 28px 40px rgba(79,70,229,0.38))',
      }}
    >
      {/* Spine (left edge) */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0,
        width: SPINE_W, height: BOOK_H,
        background: 'linear-gradient(to right, #2e1065, #3730a3)',
        borderRadius: '5px 0 0 5px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          writingMode: 'vertical-rl',
          fontSize: 7, fontWeight: 800, letterSpacing: 3,
          color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
        }}>
          forword.io
        </span>
      </div>

      {/* Front cover */}
      <div style={{
        position: 'absolute',
        left: SPINE_W, top: 0,
        width: PAGE_W, height: BOOK_H,
        background: 'linear-gradient(148deg, #6366f1 0%, #4f46e5 45%, #4338ca 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        {/* Logo in a white pill — works with any logo background */}
        <div style={{
          background: 'white',
          borderRadius: 8,
          padding: '7px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          <Image src="/logo.png" alt="forword.io" width={100} height={28} style={{ display: 'block' }} />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 600, letterSpacing: 2 }}>
          Rewards
        </p>

        {onClick && (
          <div style={{
            marginTop: 20,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 24, padding: '8px 20px',
          }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
              Tap to flip ✦
            </p>
          </div>
        )}
      </div>

      {/* Page edges — visible strip on the right side */}
      <div style={{
        position: 'absolute',
        left: SPINE_W + PAGE_W, top: 3,
        width: 12, height: BOOK_H - 6,
        background: 'repeating-linear-gradient(to right, #f2ede4, #f2ede4 2px, #e4ddd1 2px, #e4ddd1 3.5px)',
        borderRadius: '0 3px 3px 0',
      }} />

      {/* Bottom thickness for depth */}
      <div style={{
        position: 'absolute',
        bottom: -5, left: SPINE_W,
        width: PAGE_W + 12, height: 6,
        background: 'rgba(0,0,0,0.18)',
        borderRadius: '0 0 3px 3px',
        filter: 'blur(2px)',
      }} />
    </div>
  )
}

// ── FlippingBook ──────────────────────────────────────────────────────────────
// Shown while the API call is running. An open book with pages
// rapidly flipping from right to left using CSS 3D rotateY.

function FlippingBook() {
  const pages = [0, 1, 2, 3, 4, 5, 6, 7]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Perspective container — must have no filter here or it flattens 3D */}
      <div style={{
        width: BOOK_W, height: BOOK_H,
        position: 'relative',
        perspective: '900px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        borderRadius: 8,
      }}>
        {/* Left page (background) */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: PAGE_W, height: BOOK_H,
          background: 'linear-gradient(to right, #e8e2d6, #f2ede4)',
          borderRadius: '6px 0 0 6px',
        }}>
          <PageLines count={11} />
        </div>

        {/* Spine */}
        <div style={{
          position: 'absolute', left: PAGE_W, top: 0,
          width: SPINE_W, height: BOOK_H,
          background: 'linear-gradient(to right, #b0aaa0, #ccc6bc)',
        }} />

        {/* Right page (background — revealed as pages flip off) */}
        <div style={{
          position: 'absolute', left: PAGE_W + SPINE_W, top: 0,
          width: PAGE_W, height: BOOK_H,
          background: 'linear-gradient(to left, #e8e2d6, #f2ede4)',
          borderRadius: '0 6px 6px 0',
        }}>
          <PageLines count={11} />
        </div>

        {/* Flipping pages — each rotates from right to left with staggered delay */}
        {pages.map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: PAGE_W + SPINE_W,
              width: PAGE_W,
              height: BOOK_H,
              background: i % 2 === 0 ? '#f2ede4' : '#e8e2d6',
              transformOrigin: 'left center',
              animation: `bookPageFlip 0.42s ease-in-out ${(i * 0.28).toFixed(2)}s both`,
              zIndex: pages.length - i,
              borderRadius: i === 0 ? '0 6px 6px 0' : 0,
            }}
          >
            <PageLines count={10} />
          </div>
        ))}
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
        {['#6366f1', '#8b5cf6', '#ec4899'].map((color, i) => (
          <div
            key={i}
            style={{
              width: 7, height: 7, borderRadius: '50%', background: color,
              animation: `bookBounce 0.7s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── OpenBook ──────────────────────────────────────────────────────────────────
// The final state. Prize text is written directly on the right page.

function OpenBook({ prize, code }: { prize: string | null; code: string | null }) {
  return (
    <div style={{
      width: BOOK_W, height: BOOK_H,
      display: 'flex',
      boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
      borderRadius: 8,
      animation: 'bookOpenReveal 0.5s ease-out forwards',
    }}>
      {/* Left page — decorative ruled lines */}
      <div style={{
        width: PAGE_W, height: BOOK_H,
        background: 'linear-gradient(to right, #e8e2d6, #f2ede4)',
        borderRadius: '6px 0 0 6px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <PageLines count={13} />
      </div>

      {/* Spine */}
      <div style={{
        width: SPINE_W, height: BOOK_H, flexShrink: 0,
        background: 'linear-gradient(to right, #b0aaa0, #ccc6bc)',
      }} />

      {/* Right page — prize content */}
      <div style={{
        width: PAGE_W, height: BOOK_H,
        background: 'linear-gradient(to left, #e8e2d6, #f2ede4)',
        borderRadius: '0 6px 6px 0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        gap: 10,
      }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>🏆</span>

        {/* "You won!" written like a heading on the page */}
        <p style={{
          fontSize: 12, fontWeight: 800, letterSpacing: 3,
          color: '#9ca3af', textTransform: 'uppercase',
        }}>
          You won!
        </p>

        {/* Prize name — styled like handwritten page text */}
        <p style={{
          fontSize: 17, fontWeight: 700, color: '#1f2937',
          textAlign: 'center', lineHeight: 1.5,
          fontFamily: 'Georgia, "Times New Roman", serif',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 10, width: '100%',
        }}>
          {prize}
        </p>

        {/* Discount code if applicable */}
        {code && (
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1px dashed #d1d5db',
            borderRadius: 6,
            padding: '6px 12px',
            textAlign: 'center',
            width: '100%',
          }}>
            <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Your code</p>
            <p style={{
              fontSize: 15, fontWeight: 900, color: '#4f46e5',
              letterSpacing: 3, fontFamily: 'monospace',
            }}>
              {code}
            </p>
          </div>
        )}

        <p style={{
          fontSize: 11, color: '#b0aaa0',
          textAlign: 'center', lineHeight: 1.5, marginTop: 2,
        }}>
          Our team will apply<br />your reward within 2–3 days.
        </p>
      </div>
    </div>
  )
}

// ── Main BookFlip component ───────────────────────────────────────────────────

export default function BookFlip({
  totalPoints, isPaidUser, profileLoaded,
  spinsRemaining, spinsLimit, onSpinComplete,
}: Props) {
  const [phase, setPhase] = useState<'closed' | 'flipping' | 'open'>('closed')
  const [prize, setPrize] = useState<string | null>(null)
  const [prizeCode, setPrizeCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasSpinsLeft = spinsRemaining > 0
  const canSpin = isPaidUser && totalPoints >= SPIN_COST && hasSpinsLeft

  async function handleFlip() {
    if (!canSpin || phase !== 'closed') return
    setPhase('flipping')
    setError(null)
    setPrize(null)
    setPrizeCode(null)

    try {
      const res = await fetch('/api/rewards/spin', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setPhase('closed')
        return
      }

      // Let pages flip for 2.5 seconds, then reveal the prize
      await new Promise(r => setTimeout(r, 2500))
      setPrize(data.prize)
      setPrizeCode(data.prize_code ?? null)
      setPhase('open')
      onSpinComplete(data.prize, data.prize_code ?? null, data.points_remaining, data.spins_remaining ?? 0)
    } catch {
      setError('Network error. Please try again.')
      setPhase('closed')
    }
  }

  function handleReset() {
    setPhase('closed')
    setPrize(null)
    setPrizeCode(null)
  }

  return (
    <div className="flex flex-col items-center">
      {/* Book — switches between three visual states */}
      <div className="mb-8 flex justify-center" style={{ minHeight: BOOK_H + 40 }}>
        {phase === 'closed'   && <ClosedBook onClick={canSpin ? handleFlip : undefined} />}
        {phase === 'flipping' && <FlippingBook />}
        {phase === 'open'     && <OpenBook prize={prize} code={prizeCode} />}
      </div>

      {error && <p className="text-sm text-red-500 mb-4 text-center max-w-xs">{error}</p>}

      {/* CTA — wait for profile before deciding which to show */}
      {!profileLoaded ? null : !isPaidUser ? (
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">Flip the Book costs 2,500 points</p>
          <Link
            href="/dashboard/settings"
            className="inline-block px-6 py-2.5 bg-brand-button text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Upgrade to win rewards
          </Link>
        </div>
      ) : phase === 'open' ? (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-brand-button font-medium hover:opacity-75 transition-opacity"
        >
          {spinsRemaining > 0
            ? `${spinsRemaining} flip${spinsRemaining !== 1 ? 's' : ''} left this month`
            : 'No flips left this month'}
        </button>
      ) : !hasSpinsLeft ? (
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-500">
            You&apos;ve used all {spinsLimit} flip{spinsLimit !== 1 ? 's' : ''} for this month
          </p>
          <p className="text-xs text-gray-400 mt-1">Come back next month to flip again!</p>
        </div>
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
              ? `Costs 2,500 points · ${spinsRemaining} of ${spinsLimit} flip${spinsLimit !== 1 ? 's' : ''} left this month`
              : `${(SPIN_COST - totalPoints).toLocaleString()} more points needed`}
          </p>
        </div>
      )}
    </div>
  )
}
