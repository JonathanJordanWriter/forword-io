import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const [b64, sig] = token.split('.')
    if (!b64 || !sig) return null

    // Verify signature
    const expectedSig = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update(b64)
      .digest('base64url')
    if (sig !== expectedSig) return null

    // Check expiry
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString())
    if (!payload.userId || !payload.exp) return null
    if (Math.floor(Date.now() / 1000) > payload.exp) return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Missing token or password' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Reset link has expired or is invalid' }, { status: 400 })
  }

  const service = getServiceClient()
  const { error } = await service.auth.admin.updateUserById(payload.userId, { password })

  if (error) {
    console.error('updateUserById error:', error.message)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
