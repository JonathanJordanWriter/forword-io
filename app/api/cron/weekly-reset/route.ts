import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called by Vercel Cron every Sunday at 5am UTC
// (= midnight US Eastern during EST, 1am during EDT — close enough).
// It finds the top scorer for each book_type in the just-completed week,
// awards them 200 bonus points, and marks the bonus as awarded.

const WEEKLY_BONUS = 200

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Return the Sunday that started the week that just ended
// (i.e. last week's week_start, which is today's date since we run at Sunday midnight)
function getJustEndedWeekStart(): string {
  const now = new Date()
  // The cron fires at the start of Sunday — that IS the new week_start.
  // We want the week that's ending, which started the previous Sunday.
  const etString = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const [month, day, year] = etString.split('/').map(Number)
  const etDate = new Date(year, month - 1, day)
  // Go back 7 days to get the week that just completed
  etDate.setDate(etDate.getDate() - 7)
  const dow = etDate.getDay()
  etDate.setDate(etDate.getDate() - dow) // back to that Sunday
  return `${etDate.getFullYear()}-${String(etDate.getMonth() + 1).padStart(2, '0')}-${String(etDate.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const weekStart = getJustEndedWeekStart()

  const bookTypes = ['fiction', 'nonfiction']
  const results: Record<string, string | null> = {}

  for (const bookType of bookTypes) {
    // Find the top scorer for this book_type in the completed week
    const { data: rows } = await supabase
      .from('weekly_points')
      .select('id, user_id, points_earned, bonus_awarded')
      .eq('week_start', weekStart)
      .eq('book_type', bookType)
      .eq('bonus_awarded', false)
      .order('points_earned', { ascending: false })
      .limit(1)

    const winner = rows?.[0]
    if (!winner || winner.points_earned === 0) {
      results[bookType] = null
      continue
    }

    // Award 200 bonus points to the winner
    const { data: userRow } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', winner.user_id)
      .single()

    const currentTotal = (userRow?.total_points as number) ?? 0
    await supabase
      .from('users')
      .update({ total_points: currentTotal + WEEKLY_BONUS })
      .eq('id', winner.user_id)

    // Mark the bonus as awarded so it doesn't get awarded twice
    await supabase
      .from('weekly_points')
      .update({ bonus_awarded: true })
      .eq('id', winner.id)

    results[bookType] = winner.user_id
  }

  console.log(`Weekly reset complete for week starting ${weekStart}:`, results)
  return NextResponse.json({ success: true, week_start: weekStart, winners: results })
}
