import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_TIMES = ['1_2hrs', '3_5hrs', '6_10hrs']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { time_per_week } = await req.json()
  if (!VALID_TIMES.includes(time_per_week)) {
    return NextResponse.json({ error: 'Invalid time value' }, { status: 400 })
  }

  const { error } = await supabase
    .from('books')
    .update({ time_per_week })
    .eq('id', params.bookId)
    .eq('user_id', user.id) // ensure ownership

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })

  return NextResponse.json({ success: true })
}
