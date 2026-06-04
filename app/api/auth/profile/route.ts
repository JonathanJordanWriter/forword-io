import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  // Auth check via session client
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use service role to read profile — avoids any RLS policy blocking
  // the tier field from being returned, which would cause paid users to
  // appear as free and see the "Upgrade to win rewards" prompt incorrectly.
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

  return NextResponse.json({
    tier: profile?.tier ?? 'starter',
    total_points: profile?.total_points ?? 0,
    full_name: profile?.full_name ?? null,
  })
}
