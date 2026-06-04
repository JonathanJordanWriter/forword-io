import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Service client bypasses RLS — weekly_points has no policies so the
// regular session client returns no rows.
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getCurrentWeekStart(): string {
  const now = new Date()
  const etString = now.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const [month, day, year] = etString.split('/').map(Number)
  const etDate = new Date(year, month - 1, day)
  const dayOfWeek = etDate.getDay()
  etDate.setDate(etDate.getDate() - dayOfWeek)
  return `${etDate.getFullYear()}-${String(etDate.getMonth() + 1).padStart(2, '0')}-${String(etDate.getDate()).padStart(2, '0')}`
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const weekStart = getCurrentWeekStart()

  const fetchLeaderboard = async (bookType: string) => {
    const { data } = await service
      .from('weekly_points')
      .select('user_id, points_earned, bonus_awarded')
      .eq('week_start', weekStart)
      .eq('book_type', bookType)
      .order('points_earned', { ascending: false })
      .limit(10)

    if (!data || data.length === 0) return []

    // Look up display names — prefer display_name (pen name), fall back to full_name
    const userIds = data.map(r => r.user_id)
    const { data: userRows } = await service
      .from('users')
      .select('id, display_name, full_name')
      .in('id', userIds)

    const nameMap = Object.fromEntries(
      (userRows ?? []).map(u => [
        u.id,
        (u.display_name as string) || (u.full_name as string) || 'Anonymous',
      ])
    )

    return data.map((row, index) => ({
      rank: index + 1,
      user_id: row.user_id,
      display_name: nameMap[row.user_id] ?? 'Anonymous',
      points: row.points_earned,
      is_current_user: row.user_id === user.id,
      bonus_awarded: row.bonus_awarded,
    }))
  }

  const findUserRank = async (bookType: string) => {
    const { data } = await service
      .from('weekly_points')
      .select('user_id, points_earned')
      .eq('week_start', weekStart)
      .eq('book_type', bookType)
      .order('points_earned', { ascending: false })

    if (!data) return null
    const idx = data.findIndex(r => r.user_id === user.id)
    if (idx === -1) return null
    return { rank: idx + 1, points: data[idx].points_earned }
  }

  const [fictionBoard, nonfictionBoard, fictionUserRank, nonfictionUserRank] = await Promise.all([
    fetchLeaderboard('fiction'),
    fetchLeaderboard('nonfiction'),
    findUserRank('fiction'),
    findUserRank('nonfiction'),
  ])

  return NextResponse.json({
    week_start: weekStart,
    fiction: { entries: fictionBoard, user_rank: fictionUserRank },
    nonfiction: { entries: nonfictionBoard, user_rank: nonfictionUserRank },
  })
}
