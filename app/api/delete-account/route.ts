import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the user's profile to get their Stripe customer ID
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Cancel any active Stripe subscriptions so the customer isn't billed again
  if (profile?.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 10,
      })
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id)
      }
    } catch {
      // Don't block account deletion if Stripe cleanup fails
      console.error('Stripe subscription cancellation failed during account deletion')
    }
  }

  // Delete all user data from the database.
  // FK CASCADE on books → plans → tasks handles the full cleanup automatically.
  const { error: dbError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id)

  if (dbError) {
    console.error('Error deleting user data:', dbError)
    return NextResponse.json({ error: 'Failed to delete account data.' }, { status: 500 })
  }

  // Delete the auth user — requires the service role key (admin privileges)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)

  if (authError) {
    console.error('Error deleting auth user:', authError)
    // Data is already deleted — return success anyway so the client signs out
    // A dangling auth record with no profile row is harmless
  }

  return NextResponse.json({ success: true })
}
