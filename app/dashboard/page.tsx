import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SignOutButton from '@/components/SignOutButton'

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

  // Fetch active plans to show real status badges
  const { data: plans } = await supabase
    .from('plans')
    .select('book_id, completion_pct, status')
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Build a quick lookup: bookId → plan
  const planByBook = Object.fromEntries(
    (plans ?? []).map(p => [p.book_id, p])
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="forword.io" width={120} height={34} />
          <div className="flex items-center gap-6">
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

        {/* Book / plan list */}
        <div className="space-y-3">
          {books.map((book) => {
            const genres = (book.genres as string[] | null) ?? (book.genre ? [book.genre] : [])
            const stage = STAGE_LABELS[book.book_stage as string] ?? book.book_stage ?? 'Unknown stage'
            const displayTitle = book.title || 'Untitled book'
            const plan = planByBook[book.id]

            return (
              <Link
                key={book.id}
                href={`/dashboard/plan/${book.id}`}
                className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 hover:border-brand-button hover:bg-brand-accent/10 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-brand-coal group-hover:text-brand-button transition-colors truncate">
                    {displayTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {genres.length > 0 && (
                      <span className="text-xs text-gray-500">{genres.join(', ')}</span>
                    )}
                    {genres.length > 0 && (
                      <span className="text-gray-300 text-xs">·</span>
                    )}
                    <span className="text-xs text-gray-500">{stage}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4 shrink-0">
                  {plan ? (
                    plan.completion_pct > 0 ? (
                      /* Plan in progress — show progress bar */
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-button rounded-full"
                            style={{ width: `${plan.completion_pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium tabular-nums">
                          {plan.completion_pct}%
                        </span>
                      </div>
                    ) : (
                      /* Plan exists but not started yet */
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                        Ready to start
                      </span>
                    )
                  ) : (
                    /* No plan — prompt to generate */
                    <span className="text-xs px-2.5 py-1 rounded-full bg-brand-accent/20 text-brand-button font-medium border border-brand-accent/40">
                      Draft plan
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-button transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
