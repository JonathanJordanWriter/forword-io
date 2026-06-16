import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { direction } = await req.json() as { direction: 'prev' | 'next' }
  const { taskId } = params

  // Fetch the task being moved
  const { data: task } = await supabase
    .from('tasks')
    .select('id, plan_id, user_id, week_number, phase, day_number, is_locked')
    .eq('id', taskId)
    .single()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (task.is_locked) return NextResponse.json({ error: 'Cannot move a locked task' }, { status: 403 })

  // Build a week → phase map for the whole plan so we can validate boundaries
  const { data: allPlanTasks } = await supabase
    .from('tasks')
    .select('week_number, phase')
    .eq('plan_id', task.plan_id)

  const weekPhaseMap = new Map<number, number>()
  for (const t of allPlanTasks ?? []) {
    weekPhaseMap.set(t.week_number, t.phase)
  }

  const targetWeek = direction === 'next' ? task.week_number + 1 : task.week_number - 1

  // Target week must exist in the plan (has at least one task)
  if (!weekPhaseMap.has(targetWeek)) {
    return NextResponse.json({
      error: 'no_adjacent_week',
      message: 'There is no adjacent week to move this task to.',
    }, { status: 422 })
  }

  // Target week must be in the same phase
  const targetPhase = weekPhaseMap.get(targetWeek)
  if (targetPhase !== task.phase) {
    return NextResponse.json({
      error: 'phase_boundary',
      message: "Sorry, but tasks cannot be moved from one phase to another. If you need to wait on doing this task, no sweat! It will be here waiting for you whenever you're ready.",
    }, { status: 422 })
  }

  // Find the highest day_number in the target week so we can slot this task at the end
  const { data: targetWeekTasks } = await supabase
    .from('tasks')
    .select('day_number')
    .eq('plan_id', task.plan_id)
    .eq('week_number', targetWeek)

  const maxDayInTargetWeek =
    targetWeekTasks && targetWeekTasks.length > 0
      ? Math.max(...targetWeekTasks.map(t => t.day_number))
      : (targetWeek - 1) * 7

  const newDayNumber = maxDayInTargetWeek + 1

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ week_number: targetWeek, day_number: newDayNumber })
    .eq('id', taskId)

  if (updateError) return NextResponse.json({ error: 'Failed to move task' }, { status: 500 })

  return NextResponse.json({ success: true, week_number: targetWeek, day_number: newDayNumber })
}
