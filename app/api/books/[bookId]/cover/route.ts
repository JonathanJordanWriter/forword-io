import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: { bookId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify this book belongs to the user
  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', params.bookId)
    .eq('user_id', user.id)
    .single()
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('cover') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${params.bookId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from('book-covers')
    .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: true })

  if (uploadError) {
    console.error('Cover upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed', detail: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from('book-covers').getPublicUrl(path)
  // Bust the CDN cache by appending a timestamp so the new image shows immediately
  const coverUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('books')
    .update({ cover_image_url: urlData.publicUrl })
    .eq('id', params.bookId)
    .eq('user_id', user.id)

  if (dbError) {
    console.error('Cover DB update error:', dbError)
    return NextResponse.json({ error: 'Failed to save cover URL' }, { status: 500 })
  }

  return NextResponse.json({ url: coverUrl })
}
