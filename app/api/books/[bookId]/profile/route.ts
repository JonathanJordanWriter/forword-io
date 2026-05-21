import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Only allow known safe fields to be updated
  const allowed = [
    'book_type', 'genres', 'genre', 'subgenre', 'publishing_path',
    'book_stage', 'launch_timeframe', 'goals_ranked', 'primary_goal',
    'ideal_reader', 'platforms', 'time_per_week', 'monthly_budget',
    'experience_level', 'existing_audience',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', params.bookId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  return NextResponse.json({ success: true })
}
