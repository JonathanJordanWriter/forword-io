import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const service = getServiceClient()

  // Generate a recovery link server-side — the admin API does NOT validate
  // redirectTo against the allowlist, which is why the client-side approach
  // kept falling back to the Site URL.
  const { data, error } = await service.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) {
    console.error('generateLink error:', error.message)
    return NextResponse.json({ success: true })
  }

  // Build the reset link directly using the tokens from generateLink.
  // This bypasses Supabase's /auth/v1/verify endpoint entirely — which kept
  // showing about:blank regardless of redirect URL configuration.
  // The reset-password page reads the hash fragment and calls setSession().
  const { access_token, refresh_token } = data.properties ?? {}
  if (!access_token || !refresh_token) return NextResponse.json({ success: true })

  const resetLink = `https://forword.io/reset-password#access_token=${access_token}&refresh_token=${refresh_token}&type=recovery`

  // Send the email via Resend directly
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
    const err = await resendRes.text()
    console.error('Resend error:', err)
  }

  // Always return success — never confirm whether an email address is registered
  return NextResponse.json({ success: true })
}
