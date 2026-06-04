import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GeneratePlanButton from '@/components/plan/GeneratePlanButton'
import PlanView from '@/components/plan/PlanView'
import EditableTitle from '@/components/plan/EditableTitle'
import EditableBookProfile from '@/components/plan/EditableBookProfile'
import DeleteBookButton from '@/components/plan/DeleteBookButton'
import SignOutButton from '@/components/SignOutButton'
import { stripe, PLANS } from '@/lib/stripe'

export default async function PlanPage({ params }: { params: { bookId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the book, ensuring it belongs to this user
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.bookId)
    .eq('user_id', user.id)
    .single()

  if (!book) notFound()

  // Fetch the user's tier + switch tracking for locking and delete-limit logic
  const { data: profile } = await supabase
    .from('users')
    .select('tier, author_plan_switched_at, stripe_customer_id, total_points')
    .eq('id', user.id)
    .single()
  let userTier = profile?.tier ?? 'starter'

  // ── Upgrade sync ──────────────────────────────────────────────────────────
  // Webhooks are async — by the time the user lands on any page the webhook
  // may not have fired yet. Any time the DB still shows 'starter' but the user
  // has a Stripe customer ID, we verify directly with Stripe. This covers:
  //   • landing on the plan page immediately after checkout (?upgraded=1)
  //   • navigating here from the dashboard after a checkout redirect
  //   • any delayed webhook scenario
  if (userTier === 'starter' && profile?.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1,
      })

      if (subs.data.length > 0) {
        const sub = subs.data[0]
        const priceId = sub.items.data[0]?.price?.id
        const syncedTier =
          priceId === PLANS.author.priceId ? 'author' :
          priceId === PLANS.pro.priceId ? 'pro' :
          null

        if (syncedTier) {
          // Update the user's tier in the DB
          await supabase
            .from('users')
            .update({ tier: syncedTier, stripe_subscription_id: sub.id })
            .eq('id', user.id)

          // Unlock tasks: author gets 1 plan, pro gets all plans
          const plansRes = await supabase
            .from('plans')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('generated_at', { ascending: false })

          const activePlans = plansRes.data ?? []

          if (activePlans.length > 0) {
            const plansToUnlock = syncedTier === 'author'
              ? [activePlans[0]]   // only the most recent plan for Author
              : activePlans        // all plans for Pro

            await supabase
              .from('tasks')
              .update({ is_locked: false })
              .in('plan_id', plansToUnlock.map(p => p.id))
              .eq('is_locked', true)
              .eq('is_completed', false) // never touch already-completed tasks
          }

          // Use the synced tier for the rest of this page render
          userTier = syncedTier
        }
      }
    } catch (err) {
      // Don't block the page render if the sync fails — webhook will eventually catch up
      console.error('Upgrade sync failed:', err)
    }
  }

  const isStarterTier = userTier === 'starter'
  const isAuthorTier = userTier === 'author'

  // Fetch the most recent active plan for this book.
  // Using limit(1) instead of .single() so the query never errors on 0 or multiple rows.
  const { data: planRows, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('book_id', params.bookId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('generated_at', { ascending: false })
    .limit(1)

  if (planError) console.error('Plan fetch error:', planError)
  const plan = planRows?.[0] ?? null

  // Fetch tasks if a plan exists
  const tasks = plan
    ? await supabase
        .from('tasks')
        .select('*')
        .eq('plan_id', plan.id)
        .order('day_number', { ascending: true })
        .then(({ data }) => data ?? [])
    : []

  const genres = (book.genres as string[] | null) ?? (book.genre ? [book.genre] : [])
  const goalsRanked = (book.goals_ranked as string[] | null) ?? (book.primary_goal ? [book.primary_goal] : [])
  const platforms = book.platforms as { active: string[]; open_to: string[] } | null

  // ── Delete / switch-limit props for DeleteBookButton ──────────────────────
  // Determine whether deleting this book would trigger a subscription transfer
  // (Author tier + this is the unlocked book + there are other active plans).
  const isUnlockedBook =
    isAuthorTier && tasks.some((t: { is_locked: boolean; day_number: number }) => !t.is_locked && t.day_number > 30)

  // Count other active plans (to confirm there's somewhere to transfer to)
  const { count: otherPlanCount } = isUnlockedBook
    ? await supabase
        .from('plans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('book_id', params.bookId)
    : { count: 0 }

  const willTransferSub = isUnlockedBook && (otherPlanCount ?? 0) > 0

  // Has the user already used their one switch this calendar month?
  const lastSwitch = profile?.author_plan_switched_at
    ? new Date(profile.author_plan_switched_at as string)
    : null
  const now = new Date()
  const hasAlreadySwitchedThisMonth = lastSwitch
    ? lastSwitch.getMonth() === now.getMonth() && lastSwitch.getFullYear() === now.getFullYear()
    : false

  // "June 1" style date for when they can switch again
  const nextSwitchDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="forword.io" width={120} height={34} />
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors"
            >
              Your plans
            </Link>
            <Link
              href="/dashboard/rewards"
              className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors"
            >
              Rewards
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-sm text-gray-600 hover:text-brand-coal font-medium transition-colors"
            >
              Account settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Book title */}
        <div className="mb-8">
          <EditableTitle
            bookId={params.bookId}
            initialTitle={(book.title as string) ?? ''}
          />
        </div>

        {/* Book profile — editable, always visible */}
        <EditableBookProfile
          bookId={params.bookId}
          defaultCollapsed={!!plan}
          book={{
            book_type: book.book_type as string | undefined,
            genres: genres,
            subgenre: book.subgenre as string | undefined,
            publishing_path: book.publishing_path as string | undefined,
            book_stage: book.book_stage as string | undefined,
            launch_timeframe: book.launch_timeframe as string | undefined,
            goals_ranked: goalsRanked,
            platforms: platforms ?? undefined,
            time_per_week: book.time_per_week as string | undefined,
            monthly_budget: book.monthly_budget as string | undefined,
            experience_level: book.experience_level as string | undefined,
            existing_audience: book.existing_audience as string | undefined,
          }}
        />

        {/* Delete project */}
        <DeleteBookButton
          bookId={params.bookId}
          bookTitle={(book.title as string) ?? 'this project'}
          willTransferSub={willTransferSub}
          hasAlreadySwitchedThisMonth={hasAlreadySwitchedThisMonth}
          nextSwitchDate={nextSwitchDate}
        />

        {/* ── Plan section ── */}
        {plan ? (
          // Plan exists — show the plan view
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-brand-coal">
                Your 90-day plan
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium border border-green-200">
                Active
              </span>
            </div>
            <PlanView
              plan={plan as Parameters<typeof PlanView>[0]['plan']}
              tasks={tasks as Parameters<typeof PlanView>[0]['tasks']}
              isStarterTier={isStarterTier}
              userTier={userTier}
              bookId={params.bookId}
              initialTimePerWeek={(book.time_per_week as string) ?? '3_5hrs'}
              initialTotalPoints={(profile?.total_points as number) ?? 0}
            />
          </div>
        ) : (
          // No plan yet — show the generate CTA
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 mb-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-accent/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-brand-button" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-brand-coal font-semibold mb-1">Ready to draft your plan?</p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                We&apos;ll draft a personalized 90-day marketing plan based on your book profile above.
                {isStarterTier && ' Free plan includes the first 30 days.'}
              </p>
            </div>
            <GeneratePlanButton bookId={params.bookId} />
          </div>
        )}
      </div>
    </div>
  )
}
