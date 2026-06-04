import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is called by Vercel Cron every Sunday at 5am UTC
// (= midnight US Eastern during EST, 1am during EDT — close enough).
// It finds the top 3 scorers for each book_type in the just-completed week
// and awards Gold / Silver / Bronze bonus points.

const PODIUM_BONUSES = [200, 100, 50] // Gold, Silver, Bronze

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Return the Sunday that started the week that just ended
function getJustEndedWeekStart(): string {
  const now = new Date()
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
  const results: Record<string, { user_id: string; bonus: number }[]> = {}

  for (const bookType of bookTypes) {
    // Fetch top 3 scorers who haven't had a bonus awarded yet
    const { data: rows } = await supabase
      .from('weekly_points')
      .select('id, user_id, points_earned, bonus_awarded')
      .eq('week_start', weekStart)
      .eq('book_type', bookType)
      .eq('bonus_awarded', false)
      .order('points_earned', { ascending: false })
      .limit(3)

    if (!rows || rows.length === 0) {
      results[bookType] = []
      continue
    }

    results[bookType] = []

    for (let i = 0; i < rows.length; i++) {
      const entry = rows[i]
      if (entry.points_earned === 0) continue

      const bonus = PODIUM_BONUSES[i] ?? 0
      if (bonus === 0) continue

      // Award bonus points
      const { data: userRow } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', entry.user_id)
        .single()

      const currentTotal = (userRow?.total_points as number) ?? 0
      await supabase
        .from('users')
        .update({ total_points: currentTotal + bonus })
        .eq('id', entry.user_id)

      // Mark bonus as awarded so it can't be double-applied
      await supabase
        .from('weekly_points')
        .update({ bonus_awarded: true })
        .eq('id', entry.id)

      const medal = i === 0 ? 'Gold' : i === 1 ? 'Silver' : 'Bronze'
      console.log(`Weekly reset [${bookType}] ${medal}: user ${entry.user_id} awarded ${bonus} pts`)
      results[bookType].push({ user_id: entry.user_id, bonus })
    }
  }

  return NextResponse.json({ success: true, week_start: weekStart, winners: results })
}
