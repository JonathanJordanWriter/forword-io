import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // Build optional attachment from uploaded screenshot
  const attachments: { filename: string; content: Buffer }[] = []
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer())
    attachments.push({ filename: file.name || 'screenshot.png', content: buffer })
  }

  const { error } = await resend.emails.send({
    from: 'forword.io Support <support@forword.io>',
    to:   'support@forword.io',
    replyTo: userEmail !== 'Unknown (not logged in)' ? userEmail : undefined,
    subject: `[Support] New issue report from ${userEmail}`,
    html: `
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left:3px solid #ccc;margin:0;padding:0 1em;color:#555;">
        ${message.trim().replace(/\n/g, '<br>')}
      </blockquote>
      ${attachments.length > 0 ? '<p><em>Screenshot attached.</em></p>' : '<p><em>No screenshot provided.</em></p>'}
    `,
    attachments,
  })

  if (error) {
    console.error('Support email error:', error)
    return NextResponse.json({ error: 'Failed to send support request' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
