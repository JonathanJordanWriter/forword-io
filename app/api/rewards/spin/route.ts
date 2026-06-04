import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SPIN_COST = 2500

// Prize pool with weighted probabilities (weights must sum to 100)
const PRIZES = [
  { label: '$1 off next month',            code: null,     weight: 35 },
  { label: '$2 off next month',            code: null,     weight: 25 },
  { label: '10% off at ForWord Writers',   code: 'WIN10',  weight: 20 },
  { label: '1 free month of Author',       code: null,     weight: 12 },
  { label: '50% off Launch Pro for 1 month', code: null,   weight: 8  },
]

function pickPrize() {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const prize of PRIZES) {
    cumulative += prize.weight
    if (roll < cumulative) return prize
  }
  return PRIZES[0]
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check tier — only paid subscribers can spin
  const { data: profile } = await supabase
    .from('users')
    .select('tier, total_points')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const isPaid = profile.tier === 'author' || profile.tier === 'pro'
  if (!isPaid) {
    return NextResponse.json({ error: 'Upgrade required to spin' }, { status: 403 })
  }

  const currentPoints = (profile.total_points as number) ?? 0
  if (currentPoints < SPIN_COST) {
    return NextResponse.json(
      { error: `Not enough points. You need ${SPIN_COST}, you have ${currentPoints}.` },
      { status: 400 }
    )
  }

  // Deduct points and pick prize
  const prize = pickPrize()
  const newTotal = currentPoints - SPIN_COST

  await supabase
    .from('users')
    .update({ total_points: newTotal })
    .eq('id', user.id)

  await supabase
    .from('reward_spins')
    .insert({
      user_id: user.id,
      points_spent: SPIN_COST,
      prize: prize.label,
      prize_code: prize.code,
    })

  return NextResponse.json({
    success: true,
    prize: prize.label,
    prize_code: prize.code,
    points_remaining: newTotal,
  })
}
