import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Returns true if `date` falls within the same calendar month+year as now. */
function isSameCalendarMonth(date: Date): boolean {
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

/** Returns a human-readable string like "June 1" for the first day of next month. */
function nextMonthFirstDay(): string {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return first.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookId } = params

  // Verify the book belongs to this user
  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single()

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  // Fetch tier + switch tracking for Author-tier enforcement
  const { data: profile } = await supabase
    .from('users')
    .select('tier, author_plan_switched_at')
    .eq('id', user.id)
    .single()

  const isAuthorTier = profile?.tier === 'author'

  // ── Determine if this deletion will trigger a subscription transfer ──────────
  // A transfer occurs when:
  //   1. The user is on the Author tier, AND
  //   2. This book's plan has unlocked day-31+ tasks (i.e. it IS the active unlocked book), AND
  //   3. There is at least one other active plan to receive the transfer
  let willTransfer = false

  if (isAuthorTier) {
    const { data: thisBookPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (thisBookPlan) {
      const { data: unlockedTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('plan_id', thisBookPlan.id)
        .eq('is_locked', false)
        .gt('day_number', 30)
        .limit(1)

      const isUnlockedBook = (unlockedTasks?.length ?? 0) > 0

      if (isUnlockedBook) {
        // Check whether there's another plan to receive the unlock
        const { count: otherPlanCount } = await supabase
          .from('plans')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active')
          .neq('book_id', bookId)

        willTransfer = (otherPlanCount ?? 0) > 0
      }
    }
  }

  // ── Monthly switch limit (Author tier only) ──────────────────────────────────
  if (willTransfer) {
    const lastSwitch = profile?.author_plan_switched_at
      ? new Date(profile.author_plan_switched_at)
      : null

    if (lastSwitch && isSameCalendarMonth(lastSwitch)) {
      // Already used their one switch this month — reject
      return NextResponse.json(
        {
          error: 'monthly_limit_reached',
          message: `You've already switched your Author subscription to a new title this month. You can switch again on ${nextMonthFirstDay()}, or upgrade to Launch Pro for unlimited projects.`,
          nextSwitchDate: nextMonthFirstDay(),
        },
        { status: 429 }
      )
    }
  }

  // ── Delete the book (FK cascade handles plans + tasks) ──────────────────────
  const { error: deleteError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Book delete error:', deleteError)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }

  // ── Transfer unlock to the next plan (if applicable) ────────────────────────
  if (willTransfer) {
    const { data: remainingPlans } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(1)

    if (remainingPlans && remainingPlans.length > 0) {
      await supabase
        .from('tasks')
        .update({ is_locked: false })
        .eq('plan_id', remainingPlans[0].id)
        .eq('is_locked', true)
        .gt('day_number', 30)
    }

    // Record the transfer timestamp so we can enforce the monthly limit
    await supabase
      .from('users')
      .update({ author_plan_switched_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  return NextResponse.json({ success: true, transferred: willTransfer })
}
