import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Service role client bypasses RLS — used only for trusted server-side points writes
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

  // Fetch the task — include points state fields
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, plan_id, user_id, is_locked, category, is_completed, completed_at, points_awarded')
    .eq('id', taskId)
    .single()

  if (fetchError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (task.is_locked) return NextResponse.json({ error: 'Upgrade to unlock this task' }, { status: 403 })

  // Guard against double-clicks / no-op calls
  if (task.is_completed === is_completed) {
    return NextResponse.json({ success: true, is_completed, points_delta: 0 })
  }

  // ── Points state machine ───────────────────────────────────────────────────
  //
  // Each task can only ever contribute points to a user's total ONCE.
  // completed_at is set permanently on first completion and never cleared —
  // it acts as a "was ever completed" marker separate from is_completed.
  //
  // States:
  //   completed_at=null,  points_awarded=false → never done     → completing awards points
  //   completed_at=set,   points_awarded=true  → currently done → unchecking deducts points
  //   completed_at=set,   points_awarded=false → done+undone    → re-checking gives NO points;
  //                                                                unchecking again does nothing
  //
  // This prevents the check → uncheck → re-check exploit.

  const points = CATEGORY_POINTS[task.category as string] ?? 75
  const isFirstCompletion = is_completed && task.completed_at === null
  const isDeduction       = !is_completed && task.points_awarded === true
  const pointsDelta       = isFirstCompletion ? points : isDeduction ? -points : 0

  // Build the task update — completed_at is set on first completion and never cleared
  const taskUpdate: Record<string, unknown> = {
    is_completed,
    points_awarded: isFirstCompletion
      ? true                         // earning points now
      : isDeduction
        ? false                      // points removed, task now "spent"
        : task.points_awarded,       // no change (re-check after spend, or irrelevant)
  }
  if (isFirstCompletion) {
    taskUpdate.completed_at = new Date().toISOString() // set once, never cleared
  }
  // Do NOT touch completed_at on uncheck — preserve it as permanent history

  const { error: updateError } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', taskId)

  if (updateError) return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })

  // ── Apply points delta ─────────────────────────────────────────────────────
  if (pointsDelta !== 0) {
    const service = getServiceClient()

    // 1. Update running total on the user record
    const { data: userRow, error: userFetchErr } = await service
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single()

    if (userFetchErr) {
      console.error('Points: failed to fetch user total_points', userFetchErr)
    } else {
      const currentTotal = (userRow?.total_points as number) ?? 0
      const newTotal = Math.max(0, currentTotal + pointsDelta)

      const { error: updateErr } = await service
        .from('users')
        .update({ total_points: newTotal })
        .eq('id', user.id)

      if (updateErr) console.error('Points: failed to update total_points', updateErr)
    }

    // 2. Update weekly leaderboard row — look up book_type for categorisation
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

      const { data: weekRow, error: weekFetchErr } = await service
        .from('weekly_points')
        .select('id, points_earned')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .eq('book_type', bookType)
        .maybeSingle()

      if (weekFetchErr) {
        console.error('Points: failed to fetch weekly_points', weekFetchErr)
      } else if (weekRow) {
        const newWeekly = Math.max(0, weekRow.points_earned + pointsDelta)
        const { error: weekUpdateErr } = await service
          .from('weekly_points')
          .update({ points_earned: newWeekly })
          .eq('id', weekRow.id)
        if (weekUpdateErr) console.error('Points: failed to update weekly_points', weekUpdateErr)
      } else if (pointsDelta > 0) {
        const { error: weekInsertErr } = await service
          .from('weekly_points')
          .insert({ user_id: user.id, week_start: weekStart, points_earned: pointsDelta, book_type: bookType })
        if (weekInsertErr) console.error('Points: failed to insert weekly_points', weekInsertErr)
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

  return NextResponse.json({ success: true, is_completed, points_delta: pointsDelta })
}
