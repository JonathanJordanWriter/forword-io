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

  // Use service role to guarantee accurate tier/points regardless of RLS
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile, error } = await service
    .from('users')
    .select('tier, total_points, full_name')
    .eq('id', user.id)
    .single()

  if (error) console.error('Profile fetch error:', error)

  const tier = (profile?.tier as string) ?? 'starter'
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

  return NextResponse.json({
    tier,
    total_points: profile?.total_points ?? 0,
    full_name: profile?.full_name ?? null,
    spins_used: spinsUsed,
    spins_limit: spinLimit,
    spins_remaining: Math.max(0, spinLimit - spinsUsed),
  })
}
