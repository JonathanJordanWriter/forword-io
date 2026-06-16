import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId } = params

  // Verify the plan belongs to this user
  const { data: plan } = await supabase
    .from('plans')
    .select('id, user_id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { title, description, estimated_mins, category, week_number, phase } =
    await req.json() as {
      title: string
      description?: string
      estimated_mins: number
      category: string
      week_number: number
      phase: number
    }

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  // Slot the new task at the end of the target week
  const { data: weekTasks } = await supabase
    .from('tasks')
    .select('day_number')
    .eq('plan_id', planId)
    .eq('week_number', week_number)

  const maxDay =
    weekTasks && weekTasks.length > 0
      ? Math.max(...weekTasks.map(t => t.day_number))
      : (week_number - 1) * 7

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert({
      plan_id: planId,
      user_id: user.id,
      phase,
      week_number,
      day_number: maxDay + 1,
      title: title.trim(),
      description: description?.trim() ?? '',
      category: category ?? 'planning',
      platform_tag: 'all',
      estimated_mins: estimated_mins ?? 30,
      is_completed: false,
      is_locked: false,
      is_custom: true,
    })
    .select()
    .single()

  if (error || !newTask) {
    console.error('Custom task insert error:', error)
    return NextResponse.json({
      error: 'Failed to create task',
      detail: error?.message ?? 'No task returned',
      code: error?.code,
    }, { status: 500 })
  }

  return NextResponse.json({ success: true, task: newTask })
}
