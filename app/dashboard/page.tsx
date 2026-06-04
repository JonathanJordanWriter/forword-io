import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SignOutButton from '@/components/SignOutButton'
import DashboardBookList, { BookListItem } from '@/components/dashboard/DashboardBookList'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Just an idea',
  still_writing: 'Still writing',
  finished_manuscript: 'Finished manuscript',
  beta_reading: 'Beta reading',
  revision: 'In revision',
  editing: 'Editing',
  cover_design: 'Cover & production',
  published: 'Published',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all books for this user
  const { data: books } = await supabase
    .from('books')
    .select('id, title, book_stage, genres, genre, book_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // New user with no books — send to onboarding
  if (!books || books.length === 0) redirect('/onboarding')

  // Fetch active plans (with IDs so we can check task lock status)
  const { data: plans } = await supabase
    .from('plans')
    .select('id, book_id, completion_pct, status')
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Fetch user profile for tier + switch tracking + points
  const { data: profile } = await supabase
    .from('users')
    .select('tier, author_plan_switched_at, total_points')
    .eq('id', user.id)
    .single()

  const isAuthorTier = profile?.tier === 'author'

  // For Author tier: find which book (if any) has unlocked day-31+ tasks —
  // that's the "active" book whose deletion would trigger a subscription transfer.
  let unlockedBookId: string | null = null
  if (isAuthorTier && plans && plans.length > 0) {
    const planIds = plans.map(p => p.id)
    const { data: unlockedTask } = await supabase
      .from('tasks')
      .select('plan_id')
      .in('plan_id', planIds)
      .eq('is_locked', false)
      .gt('day_number', 30)
      .limit(1)
      .single()

    if (unlockedTask) {
      const matchedPlan = plans.find(p => p.id === unlockedTask.plan_id)
      unlockedBookId = matchedPlan?.book_id ?? null
    }
  }

  // Subscription switch timing
  const now = new Date()
  const lastSwitch = profile?.author_plan_switched_at
    ? new Date(profile.author_plan_switched_at as string)
    : null
  const hasAlreadySwitchedThisMonth = lastSwitch
    ? lastSwitch.getMonth() === now.getMonth() && lastSwitch.getFullYear() === now.getFullYear()
    : false
  const nextSwitchDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  // Build a quick lookup: bookId → plan
  const planByBook = Object.fromEntries(
    (plans ?? []).map(p => [p.book_id, p])
  )

  // Assemble the enriched book list for the client component
  const bookItems: BookListItem[] = books.map((book) => {
    const genres = (book.genres as string[] | null) ?? (book.genre ? [book.genre] : [])
    const plan = planByBook[book.id]

    // willTransferSub: Author tier, this is the unlocked book, and there are other books
    const isUnlockedBook = isAuthorTier && book.id === unlockedBookId
    const willTransferSub = isUnlockedBook && books.length > 1

    return {
      id: book.id,
      title: book.title || 'Untitled book',
      stage: STAGE_LABELS[book.book_stage as string] ?? book.book_stage ?? 'Unknown stage',
      genres,
      plan: plan ? { completion_pct: plan.completion_pct } : null,
      willTransferSub,
      hasAlreadySwitchedThisMonth,
      nextSwitchDate,
    }
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="forword.io" width={120} height={34} />
          <div className="flex items-center gap-6">
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-coal">Your marketing plans</h1>
            <p className="text-gray-500 text-sm mt-1">
              {books.length === 1 ? '1 book' : `${books.length} books`}
            </p>
          </div>
          <Link
            href="/onboarding"
            className="px-4 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            + Add another book
          </Link>
        </div>

        {/* Points widget */}
        {((profile?.total_points as number) ?? 0) >= 0 && (
          <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-brand-accent/30 to-purple-50 border border-brand-accent/40 rounded-2xl px-5 py-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Your reward points</p>
              <p className="text-2xl font-bold text-brand-coal">
                {((profile?.total_points as number) ?? 0).toLocaleString()}
                <span className="text-sm font-normal text-gray-400 ml-1">pts</span>
              </p>
            </div>
            <Link
              href="/dashboard/rewards"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-button text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              View Rewards
            </Link>
          </div>
        )}

        {/* Book / plan list — client component handles delete interaction */}
        <DashboardBookList books={bookItems} />
      </div>
    </div>
  )
}
