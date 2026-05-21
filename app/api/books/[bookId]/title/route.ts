import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const { error } = await supabase
    .from('books')
    .update({ title: title.trim() })
    .eq('id', params.bookId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update title' }, { status: 500 })
  return NextResponse.json({ success: true })
}
