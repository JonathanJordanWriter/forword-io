import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, firstName } = await request.json()

  const apiKey = process.env.KIT_API_KEY
  const sequenceId = process.env.KIT_SEQUENCE_ID

  console.log('Kit subscribe called:', { email, firstName, hasApiKey: !!apiKey, sequenceId })

  if (!apiKey || !sequenceId || !email) {
    console.error('Kit subscribe: missing config', { hasApiKey: !!apiKey, hasSequenceId: !!sequenceId, hasEmail: !!email })
    return NextResponse.json({ error: 'Missing config' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.kit.com/v4/sequences/${sequenceId}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': apiKey,
      },
      body: JSON.stringify({
        email_address: email,
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
