import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key so we can write to the users table without RLS
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Map Stripe price IDs to tier names
function tierFromPriceId(priceId: string): 'author' | 'pro' | null {
  if (priceId === process.env.STRIPE_AUTHOR_PRICE_ID) return 'author'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  return null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      const priceId = sub.items.data[0]?.price?.id
      const tier = tierFromPriceId(priceId)
      if (!tier) break

      const isActive = sub.status === 'active' || sub.status === 'trialing'
      // current_period_end lives on the subscription's billing cycle anchor in newer API versions
      const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
      const tierExpires = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

      await supabase
        .from('users')
        .update({
          tier: isActive ? tier : 'starter',
          tier_expires_at: isActive ? tierExpires : null,
          stripe_subscription_id: isActive ? sub.id : null,
        })
        .eq('id', userId)

      // Unlock tasks based on tier:
      // - author: full 90 days for 1 book (the one they upgraded from, if known)
      // - pro: full 90 days across all books
      if (isActive) {
        const { data: allPlans } = await supabase
          .from('plans')
          .select('id, book_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('generated_at', { ascending: false })

        const plans = allPlans ?? []

        let plansToUnlock = plans
        if (tier === 'author') {
          // Prefer the specific book recorded in subscription metadata (set at checkout).
          // Fall back to most recently generated plan if metadata is absent.
          const bookId = sub.metadata?.book_id
          const targetPlan = bookId
            ? plans.find(p => p.book_id === bookId)
            : null
          plansToUnlock = [targetPlan ?? plans[0]].filter(Boolean)
        }

        if (plansToUnlock.length > 0) {
          await supabase
            .from('tasks')
            .update({ is_locked: false })
            .in('plan_id', plansToUnlock.map(p => p.id))
            .eq('is_locked', true)
            .eq('is_completed', false) // never touch already-completed tasks
        }

        // For author tier: re-lock day 31+ tasks on all other books
        if (tier === 'author' && plansToUnlock.length > 0) {
          const unlockedPlanId = plansToUnlock[0].id
          const plansToRelock = plans.filter(p => p.id !== unlockedPlanId)

          if (plansToRelock.length > 0) {
            await supabase
              .from('tasks')
              .update({ is_locked: true })
              .in('plan_id', plansToRelock.map(p => p.id))
              .eq('is_completed', false)
              .gt('day_number', 30)
          }
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (!userId) break

      // Downgrade to starter and re-lock tasks beyond day 30
      await supabase
        .from('users')
        .update({ tier: 'starter', tier_expires_at: null, stripe_subscription_id: null })
        .eq('id', userId)

      const { data: plans } = await supabase
        .from('plans')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (plans && plans.length > 0) {
        await supabase
          .from('tasks')
          .update({ is_locked: true })
          .in('plan_id', plans.map(p => p.id))
          .eq('is_completed', false)
          .gt('day_number', 30)
      }
      break
    }

    case 'invoice.payment_failed': {
      // Log for now — Resend email reminders can be added later
      const invoice = event.data.object as Stripe.Invoice
      console.error('Payment failed for customer:', invoice.customer)
      break
    }

    default:
      // Ignore unhandled event types
      break
  }

  return NextResponse.json({ received: true })
}
