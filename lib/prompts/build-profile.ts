/**
 * Assembles a book's database record into a clean JSON object
 * ready to send to Claude as the user message content.
 */
export function buildAuthorProfile(book: Record<string, unknown>): string {
  const genres = (book.genres as string[] | null) ?? (book.genre ? [book.genre as string] : [])
  const goalsRanked = (book.goals_ranked as string[] | null) ?? (book.primary_goal ? [book.primary_goal as string] : [])
  const platforms = book.platforms as { active: string[]; open_to: string[]; recommended?: string[] } | null
  const compTitles = book.comp_titles as { title: string; author: string; year?: number }[] | null
  const idealReader = book.ideal_reader as { age_ranges?: string[]; interests?: string[]; comp_authors?: string[] } | null

  const profile = {
    book_title: book.title || 'Untitled',
    book_type: book.book_type,
    genres,
    subgenre: book.subgenre || null,
    publishing_path: book.publishing_path || 'undecided',
    book_stage: book.book_stage,
    launch_timeframe: book.launch_timeframe || null,
    comp_titles: compTitles ?? [],
    primary_goal: goalsRanked[0] ?? null,
    goals_ranked: goalsRanked,
    ideal_reader: {
      age_ranges: idealReader?.age_ranges ?? [],
      interests: idealReader?.interests ?? [],
      comp_authors: idealReader?.comp_authors ?? [],
    },
    platforms: {
      active: platforms?.active ?? [],
      open_to: platforms?.open_to ?? [],
    },
    time_per_week: book.time_per_week || '3_5hrs',
    monthly_budget: book.monthly_budget || '0_50',
    experience_level: book.experience_level || 'first_time',
    existing_audience: book.existing_audience || 'under_500',
    // null = not a published title (question was not asked); true/false = user's answer
    kdp_select: book.kdp_select ?? null,
    // true = author spans multiple genres; suppress genre-specific identity tasks
    writes_multiple_genres: book.writes_multiple_genres ?? false,
    // true = author already has an agent; suppress all querying/agent-finding tasks
    has_agent: book.has_agent ?? null,
    // tools the author already has for this book — skip sign-up tasks, generate usage tasks instead
    existing_tools: (book.book_tools as string[] | null) ?? [],
  }

  return JSON.stringify(profile, null, 2)
}

/**
 * Derives the plan_type from the book's production stage.
 * Used as a hint to Claude and stored in the plans table.
 */
export function planTypeFromStage(bookStage: string): string {
  const map: Record<string, string> = {
    idea:                'foundation',
    outlining:           'foundation',
    still_writing:       'foundation',
    finished_manuscript: 'audience_build',
    beta_reading:        'audience_build',
    revision:            'audience_build',
    editing:             'audience_build',
    line_edit:           'audience_build',
    cover_design:        'launch_countdown',
    proofreading:        'launch_countdown',
    published:           'relaunch',
  }
  return map[bookStage] ?? 'foundation'
}
