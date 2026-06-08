import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Sign a payload with HMAC-SHA256 using the service role key as secret
function signToken(payload: object): string {
  const data = JSON.stringify(payload)
  const b64 = Buffer.from(data).toString('base64url')
  const sig = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(b64)
    .digest('base64url')
  return `${b64}.${sig}`
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const service = getServiceClient()

  // Look up the user — if they don't exist, return success silently
  const { data: { users }, error: listError } = await service.auth.admin.listUsers()
  if (listError) {
    console.error('listUsers error:', listError.message)
    return NextResponse.json({ success: true })
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return NextResponse.json({ success: true }) // don't reveal if email exists

  // Build a signed token: { userId, exp } — expires in 1 hour
  const payload = { userId: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }
  const token = signToken(payload)

  const resetLink = `https://forword.io/reset-password?t=${token}`

  // Send via Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(process.env.RESEND_API_KEY ?? '').trim()}`,
    },
    body: JSON.stringify({
      from: 'forword.io <noreply@forword.io>',
      to: email,
      subject: 'Reset your forword.io password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <img src="https://forword.io/logo.png" alt="forword.io" style="height:36px;margin-bottom:24px;" />
          <h2 style="color:#1a1a2e;margin-bottom:8px;">Reset your password</h2>
          <p style="color:#6b7280;margin-bottom:24px;">
            Click the button below to set a new password for your forword.io account.
            This link expires in 1 hour.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
            Reset password
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  })

  if (!resendRes.ok) {
    console.error('Resend error:', await resendRes.text())
  }

  return NextResponse.json({ success: true })
}
