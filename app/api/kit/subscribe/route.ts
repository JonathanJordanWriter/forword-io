import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, firstName } = await request.json()

  const apiSecret = process.env.KIT_API_SECRET
  const sequenceId = process.env.KIT_SEQUENCE_ID

  console.log('Kit subscribe called:', { email, firstName, hasApiSecret: !!apiSecret, sequenceId })

  if (!apiSecret || !sequenceId || !email) {
    console.error('Kit subscribe: missing config', { hasApiSecret: !!apiSecret, hasSequenceId: !!sequenceId, hasEmail: !!email })
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

    const responseText = await res.text()
    console.log('Kit API response:', res.status, responseText)

    if (!res.ok) {
      console.error('Kit subscribe error:', res.status, responseText)
      return NextResponse.json({ error: 'Kit error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit subscribe exception:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
