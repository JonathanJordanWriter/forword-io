import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Points awarded per task category
const CATEGORY_POINTS: Record<string, number> = {
  planning:   75,
  foundation: 75,
  social:     100,
  email:      100,
  pr:         150,
  publishing: 150,
}

// Return the Sunday that begins the current week in US Eastern time
function getCurrentWeekStart(): string {
  const now = new Date()
  const etString = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const [month, day, year] = etString.split('/').map(Number)
  const etDate = new Date(year, month - 1, day)
  const dayOfWeek = etDate.getDay() // 0 = Sunday
  etDate.setDate(etDate.getDate() - dayOfWeek)
  return `${etDate.getFullYear()}-${String(etDate.getMonth() + 1).padStart(2, '0')}-${String(etDate.getDate()).padStart(2, '0')}`
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = params
  const { is_completed } = await req.json()

  // Fetch the task — include category so we can award points
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, plan_id, user_id, is_locked, category, is_completed')
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

  // ── Award / deduct points ──────────────────────────────────────────────────
  const points = CATEGORY_POINTS[task.category] ?? 75
  const delta = is_completed ? points : -points

  // Only award if the task state is actually changing (guard against double-clicks)
  const wasAlreadyCompleted = task.is_completed === is_completed
  if (!wasAlreadyCompleted && delta !== 0) {
    // 1. Update running total on the user record
    const { data: userRow } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single()

    const currentTotal = (userRow?.total_points as number) ?? 0
    const newTotal = Math.max(0, currentTotal + delta)

    await supabase
      .from('users')
      .update({ total_points: newTotal })
      .eq('id', user.id)

    // 2. Update weekly leaderboard row — need the book_type for categorisation
    const { data: planRow } = await supabase
      .from('plans')
      .select('book_id')
      .eq('id', task.plan_id)
      .single()

    if (planRow?.book_id) {
      const { data: bookRow } = await supabase
        .from('books')
        .select('book_type')
        .eq('id', planRow.book_id)
        .single()

      const bookType = (bookRow?.book_type as string) ?? 'fiction'
      const weekStart = getCurrentWeekStart()

      // Upsert weekly_points — increment or decrement, floor at 0
      const { data: weekRow } = await supabase
        .from('weekly_points')
        .select('id, points_earned')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .eq('book_type', bookType)
        .single()

      if (weekRow) {
        const newWeekly = Math.max(0, weekRow.points_earned + delta)
        await supabase
          .from('weekly_points')
          .update({ points_earned: newWeekly })
          .eq('id', weekRow.id)
      } else if (delta > 0) {
        // Only create a new row when earning (not when un-completing with no existing row)
        await supabase
          .from('weekly_points')
          .insert({ user_id: user.id, week_start: weekStart, points_earned: delta, book_type: bookType })
      }
    }
  }

  // ── Recalculate plan completion_pct ───────────────────────────────────────
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('is_completed, is_locked')
    .eq('plan_id', task.plan_id)

  if (allTasks) {
    const unlocked = allTasks.filter(t => !t.is_locked)
    const completedCount = unlocked.filter(t => t.is_completed).length
    const pct = unlocked.length > 0 ? Math.round((completedCount / unlocked.length) * 100) : 0
    await supabase.from('plans').update({ completion_pct: pct }).eq('id', task.plan_id)
  }

  return NextResponse.json({ success: true, is_completed, points_delta: wasAlreadyCompleted ? 0 : delta })
}
