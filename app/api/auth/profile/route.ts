import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tier, total_points, full_name')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    tier: profile?.tier ?? 'starter',
    total_points: profile?.total_points ?? 0,
    full_name: profile?.full_name ?? null,
  })
}
