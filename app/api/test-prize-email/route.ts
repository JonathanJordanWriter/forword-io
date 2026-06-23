import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(process.env.RESEND_API_KEY ?? '').trim()}`,
    },
    body: JSON.stringify({
      from: 'forword.io <noreply@forword.io>',
      to: user.email,
      subject: 'You won a prize! Your 10% off code for ForWord Writers',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <img src="https://forword.io/logo.png" alt="forword.io" style="height:36px;margin-bottom:24px;" />
          <h2 style="color:#1a1a1a;margin-bottom:8px;">You flipped a winner! 🎉</h2>
          <p style="color:#6b7280;margin-bottom:24px;">
            Congratulations! You won <strong>10% off</strong> at the ForWord Writers Etsy shop.
            Use the code below at checkout:
          </p>
          <div style="background:#f3f4f6;border-radius:12px;padding:16px 24px;text-align:center;margin-bottom:24px;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">Your coupon code</p>
            <p style="color:#0049ac;font-size:28px;font-weight:700;letter-spacing:4px;margin:0;">WIN10</p>
          </div>
          <a href="https://www.etsy.com/shop/forwordwriters"
             style="display:inline-block;background:#0049ac;color:white;text-decoration:none;
                    padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
            Shop ForWord Writers on Etsy
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
            Keep completing tasks to earn more points and flip again next month!
          </p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ sent: true, to: user.email })
}
