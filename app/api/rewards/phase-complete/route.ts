import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const PHASE_BONUSES: Record<number, number> = {
  1: 100, 2: 150, 3: 200, 4: 250, 5: 300,
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId, phaseNumber } = await req.json()
  if (!planId || !phaseNumber) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  // Verify ownership
  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Server-side verify: all unlocked tasks in the phase must be complete
  const { data: phaseTasks } = await supabase
    .from('tasks')
    .select('id, is_completed, is_locked')
    .eq('plan_id', planId)
    .eq('phase', phaseNumber)

  const unlocked = (phaseTasks ?? []).filter(t => !t.is_locked)
  if (unlocked.length === 0 || !unlocked.every(t => t.is_completed)) {
    return NextResponse.json({ error: 'Phase not fully complete' }, { status: 400 })
  }

  const bonus = PHASE_BONUSES[phaseNumber as number] ?? 100
  const service = getServiceClient()

  // UNIQUE(plan_id, phase_number) prevents double-awarding
  const { error: insertErr } = await service
    .from('phase_bonuses')
    .insert({ user_id: user.id, plan_id: planId, phase_number: phaseNumber, bonus_points: bonus })

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Already awarded — tell client so it doesn't show modal
      return NextResponse.json({ already_awarded: true, bonus: 0 })
    }
    console.error('Phase bonus insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to record bonus' }, { status: 500 })
  }

  const { data: newTotal, error: pointsErr } = await service
    .rpc('increment_user_points', { p_user_id: user.id, p_delta: bonus })

  if (pointsErr) console.error('Phase bonus points error:', pointsErr)

  return NextResponse.json({ success: true, bonus, new_total: newTotal ?? 0 })
}
