import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const SPIN_COST = 2500

// Monthly spin limits per tier
const SPIN_LIMITS: Record<string, number> = {
  author: 2,
  pro:    5,
}

// Prize pool with weighted probabilities (weights must sum to 100)
const PRIZES = [
  { label: '$2 off next month', couponId: 'Ty8QQR74', code: null, weight: 40 },
  { label: '$3 off next month', couponId: 'AiB9bW6w', code: null, weight: 30 },
  { label: '10% off at ForWord Writers', couponId: null, code: 'WIN10', weight: 25 },
  { label: '$9 off next month', couponId: 'Ymq4wQmm', code: null, weight: 5  },
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

// First moment of the current calendar month in US Eastern time, as ISO string
function getCurrentMonthStart(): string {
  const now = new Date()
  const etString = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const [month, , year] = etString.split('/').map(Number)
  // Midnight ET on the 1st of this month → convert to UTC for DB comparison
  const monthStartET = new Date(year, month - 1, 1, 0, 0, 0)
  // Offset: EST = UTC-5, EDT = UTC-4. Use a conservative UTC equivalent.
  // We overshoot slightly (include late Dec 31 UTC) which is safe for a count query.
  return new Date(monthStartET.getTime() + 5 * 60 * 60 * 1000).toISOString()
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()

  // Read profile via service role so tier is always accurate
  const { data: profile } = await service
    .from('users')
    .select('tier, total_points')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tier = profile.tier as string
  const isPaid = tier === 'author' || tier === 'pro'
  if (!isPaid) {
    return NextResponse.json({ error: 'Upgrade required to spin' }, { status: 403 })
  }

  // Check monthly spin limit
  const monthLimit = SPIN_LIMITS[tier] ?? 0
  const monthStart = getCurrentMonthStart()

  const { count: spinsThisMonth } = await service
    .from('reward_spins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  const usedSpins = spinsThisMonth ?? 0
  if (usedSpins >= monthLimit) {
    return NextResponse.json(
      {
        error: `You've used all ${monthLimit} flip${monthLimit !== 1 ? 's' : ''} for this month. Come back next month!`,
        spins_used: usedSpins,
        spins_limit: monthLimit,
      },
      { status: 429 }
    )
  }

  const currentPoints = (profile.total_points as number) ?? 0
  if (currentPoints < SPIN_COST) {
    return NextResponse.json(
      { error: `Not enough points. You need ${SPIN_COST.toLocaleString()}, you have ${currentPoints.toLocaleString()}.` },
      { status: 400 }
    )
  }

  // Deduct points and pick prize
  const prize = pickPrize()
  const newTotal = currentPoints - SPIN_COST

  await service
    .from('users')
    .update({ total_points: newTotal })
    .eq('id', user.id)

  await service
    .from('reward_spins')
    .insert({
      user_id: user.id,
      points_spent: SPIN_COST,
      prize: prize.label,
      prize_code: prize.code,
    })

  // Auto-apply Stripe coupon if the prize has one
  if (prize.couponId) {
    const { data: userProfile } = await service
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (userProfile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(userProfile.stripe_subscription_id, {
          coupon: prize.couponId,
        })
      } catch (err) {
        console.error('Failed to apply Stripe coupon:', err)
      }
    }
  }

  return NextResponse.json({
    success: true,
    prize: prize.label,
    prize_code: prize.code,
    points_remaining: newTotal,
    spins_used: usedSpins + 1,
    spins_limit: monthLimit,
    spins_remaining: monthLimit - (usedSpins + 1),
  })
}
