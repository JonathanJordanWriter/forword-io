import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, PlanKey } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, bookId } = await req.json() as { plan: PlanKey; bookId?: string }
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Use the request origin so localhost works during development
  // and the real domain works in production automatically
  const appUrl = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const successUrl = bookId
    ? `${appUrl}/dashboard/plan/${bookId}?upgraded=1`
    : `${appUrl}/dashboard?upgraded=1`
  const cancelUrl = bookId
    ? `${appUrl}/dashboard/plan/${bookId}`
    : `${appUrl}/dashboard`

  // Fetch or create the Stripe customer for this user
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Check if the user already has an active subscription
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 10,
  })

  if (existingSubs.data.length > 0) {
    // User is already subscribed — update their existing subscription to the new plan
    // and cancel any duplicates so there's never more than one active subscription
    const [primary, ...duplicates] = existingSubs.data

    // Cancel any duplicate subscriptions immediately
    for (const dup of duplicates) {
      await stripe.subscriptions.cancel(dup.id)
    }

    // Update the primary subscription to the new price
    const updatedSub = await stripe.subscriptions.update(primary.id, {
      items: [{ id: primary.items.data[0].id, price: PLANS[plan].priceId }],
      proration_behavior: 'always_invoice',
      metadata: { supabase_user_id: user.id, plan },
    })

    // Update the tier immediately in the database — don't rely solely on the webhook
    // so the user sees the change right away
    const newTier = plan === 'pro' ? 'pro' : 'author'
    await supabase
      .from('users')
      .update({ tier: newTier, stripe_subscription_id: updatedSub.id })
      .eq('id', user.id)

    // If upgrading to Pro, unlock all tasks across all active plans
    if (newTier === 'pro') {
      const { data: allPlans } = await supabase
        .from('plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (allPlans && allPlans.length > 0) {
        await supabase
          .from('tasks')
          .update({ is_locked: false })
          .in('plan_id', allPlans.map(p => p.id))
          .eq('is_locked', true)
          .eq('is_completed', false) // never touch already-completed tasks
      }
    }

    // Return the success URL directly — no need to go through Stripe checkout
    return NextResponse.json({ url: successUrl, subscriptionId: updatedSub.id })
  }

  // No existing subscription — create a fresh checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { supabase_user_id: user.id, plan },
    subscription_data: {
      // Include book_id so the webhook knows which book's plan to unlock for Author tier
      metadata: { supabase_user_id: user.id, plan, ...(bookId ? { book_id: bookId } : {}) },
    },
  })

  return NextResponse.json({ url: session.url })
}
