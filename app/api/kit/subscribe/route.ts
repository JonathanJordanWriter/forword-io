import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, firstName } = await request.json()

  const apiSecret = process.env.KIT_API_SECRET
  const sequenceId = process.env.KIT_SEQUENCE_ID

  if (!apiSecret || !sequenceId || !email) {
    return NextResponse.json({ error: 'Missing config' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.convertkit.com/v3/sequences/${sequenceId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: apiSecret,
        email,
        first_name: firstName ?? '',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Kit subscribe error:', res.status, err)
      return NextResponse.json({ error: 'Kit error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit subscribe exception:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
