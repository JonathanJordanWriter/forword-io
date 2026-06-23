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
// creditCents: negative invoice item applied to next billing cycle (in cents)
const PRIZES = [
  { label: '$2 off next month', creditCents: 200,  code: null,   weight: 40 },
  { label: '$3 off next month', creditCents: 300,  code: null,   weight: 30 },
  { label: '10% off at ForWord Writers', creditCents: null, code: 'WIN10', weight: 25 },
  { label: '$9 off next month', creditCents: 900,  code: null,   weight: 5  },
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

  // Auto-apply credit to next invoice if the prize has a dollar value
  if (prize.creditCents) {
    const { data: userProfile } = await service
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userProfile?.stripe_customer_id) {
      try {
        await stripe.invoiceItems.create({
          customer: userProfile.stripe_customer_id,
          amount: -prize.creditCents,
          currency: 'usd',
          description: `ForWord.io reward: ${prize.label}`,
        })
      } catch (err) {
        console.error('Failed to apply reward credit:', err)
      }
    }
  }

  // Send email for ForWord Writers Etsy prize
  if (prize.code === 'WIN10' && user.email) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(process.env.RESEND_API_KEY ?? '').trim()}`,
      },
      body: JSON.stringify({
        from: 'forword.io <noreply@forword.io>',
        to: user.email,
        subject: 'You won a prize! Your 10% off code for ForWord Writers',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <img src="https://forword.io/logo.png" alt="forword.io" style="height:36px;margin-bottom:24px;" />
            <h2 style="color:#1a1a1a;margin-bottom:8px;">You flipped a winner! 🎉</h2>
            <p style="color:#6b7280;margin-bottom:24px;">
              Congratulations! You won <strong>10% off</strong> at the ForWord Writers Etsy shop.
              Use the code below at checkout:
            </p>
            <div style="background:#f3f4f6;border-radius:12px;padding:16px 24px;text-align:center;margin-bottom:24px;">
              <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Your coupon code</p>
              <p style="color:#0049ac;font-size:28px;font-weight:700;letter-spacing:4px;margin:0;">WIN10</p>
            </div>
            <a href="https://www.etsy.com/shop/forwordwriters"
               style="display:inline-block;background:#0049ac;color:white;text-decoration:none;
                      padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
              Shop ForWord Writers on Etsy
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
              Keep completing tasks to earn more points and flip again next month!
            </p>
          </div>
        `,
      }),
    })
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
