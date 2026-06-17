import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Service role client needed to upload to Storage without RLS restrictions
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const formData = await req.formData()
  const message  = formData.get('message') as string | null
  const file     = formData.get('screenshot') as File | null

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const userEmail = user?.email ?? 'Unknown (not logged in)'
  const userId    = user?.id    ?? 'n/a'

  // Upload screenshot to Supabase Storage and get a public URL.
  // Using a link instead of an email attachment so it survives email forwarding.
  let screenshotUrl: string | null = null
  if (file && file.size > 0) {
    const ext      = file.name.split('.').pop() ?? 'png'
    const filename = `support/${Date.now()}-${userId}.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('support-screenshots')
      .upload(filename, buffer, { contentType: file.type || 'image/png', upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage
        .from('support-screenshots')
        .getPublicUrl(filename)
      screenshotUrl = urlData.publicUrl
    } else {
      console.error('Screenshot upload error:', uploadError)
    }
  }

  const { error } = await resend.emails.send({
    from:    'forword.io Support <support@forword.io>',
    to:      'jonathan@wordrobemedia.com',
    replyTo: userEmail !== 'Unknown (not logged in)' ? userEmail : undefined,
    subject: `[Support] New issue report from ${userEmail}`,
    html: `
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left:3px solid #ccc;margin:0;padding:0 1em;color:#555;">
        ${message.trim().replace(/\n/g, '<br>')}
      </blockquote>
      ${screenshotUrl
        ? `<p><strong>Screenshot:</strong> <a href="${screenshotUrl}" target="_blank">View screenshot</a></p>
           <p><img src="${screenshotUrl}" alt="Screenshot" style="max-width:600px;border:1px solid #eee;border-radius:8px;" /></p>`
        : '<p><em>No screenshot provided.</em></p>'
      }
    `,
  })

  if (error) {
    console.error('Support email error:', error)
    return NextResponse.json({ error: 'Failed to send support request' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
