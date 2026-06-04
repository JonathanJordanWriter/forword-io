import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const SPIN_LIMITS: Record<string, number> = {
  author: 2,
  pro:    5,
}

function getCurrentMonthStart(): string {
  const now = new Date()
  const etString = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const [month, , year] = etString.split('/').map(Number)
  const monthStartET = new Date(year, month - 1, 1, 0, 0, 0)
  return new Date(monthStartET.getTime() + 5 * 60 * 60 * 1000).toISOString()
}

export async function GET() {
  // Auth check via session client
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch tier + name separately from total_points so a missing column
  // on either side can't cause the other to fail.
  const { data: coreRow, error: coreErr } = await service
    .from('users')
    .select('tier, full_name')
    .eq('id', user.id)
    .single()

  if (coreErr) console.error('Profile core fetch error:', coreErr)

  const tier = (coreRow?.tier as string) ?? 'starter'

  // total_points is a newer column — fetch separately so a schema issue
  // here never causes the tier to fall back to 'starter' incorrectly.
  let totalPoints = 0
  const { data: pointsRow, error: pointsErr } = await service
    .from('users')
    .select('total_points')
    .eq('id', user.id)
    .single()

  if (pointsErr) {
    console.error('Profile points fetch error (total_points column may not exist yet):', pointsErr)
  } else {
    totalPoints = (pointsRow?.total_points as number) ?? 0
  }

  const spinLimit = SPIN_LIMITS[tier] ?? 0

  // Count spins used this calendar month
  let spinsUsed = 0
  if (spinLimit > 0) {
    const { count } = await service
      .from('reward_spins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', getCurrentMonthStart())
    spinsUsed = count ?? 0
  }

  console.log(`Profile loaded for ${user.id}: tier=${tier}, points=${totalPoints}, spinLimit=${spinLimit}`)

  return NextResponse.json({
    tier,
    total_points: totalPoints,
    full_name: coreRow?.full_name ?? null,
    spins_used: spinsUsed,
    spins_limit: spinLimit,
    spins_remaining: Math.max(0, spinLimit - spinsUsed),
  })
}
