import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = params
  const { is_completed } = await req.json()

  // Fetch the task — verify ownership and locked state
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, plan_id, user_id, is_locked')
    .eq('id', taskId)
    .single()

  if (fetchError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (task.is_locked) return NextResponse.json({ error: 'Upgrade to unlock this task' }, { status: 403 })

  // Toggle completion
  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      is_completed,
      completed_at: is_completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  if (updateError) return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })

  // Recalculate and update plan completion_pct
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('is_completed, is_locked')
    .eq('plan_id', task.plan_id)

  if (allTasks) {
    const unlocked = allTasks.filter(t => !t.is_locked)
    const completedCount = unlocked.filter(t => t.is_completed).length
    const pct = unlocked.length > 0 ? Math.round((completedCount / unlocked.length) * 100) : 0

    await supabase
      .from('plans')
      .update({ completion_pct: pct })
      .eq('id', task.plan_id)
  }

  return NextResponse.json({ success: true, is_completed })
}
