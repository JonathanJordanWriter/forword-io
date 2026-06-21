import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { PLAN_GENERATION_SYSTEM_PROMPT } from '@/lib/prompts/plan-generation'
import { buildAuthorProfile, planTypeFromStage } from '@/lib/prompts/build-profile'

// Claude model — sonnet is cost-effective for plan generation
const MODEL = 'claude-sonnet-4-6'

// Task shape returned by Claude
interface ClaudeTask {
  day_number: number
  week_number: number
  title: string
  description: string
  category: string
  platform_tag: string
  estimated_mins: number
}

interface ClaudePhase {
  phase_number: number
  title: string
  description: string
  week_start: number
  week_end: number
  tasks: ClaudeTask[]
}

interface ClaudePlanOutput {
  plan_type: string
  total_tasks: number
  phases: ClaudePhase[]
}

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse request body
  // regenerate: true  → replace the plan but keep completed tasks
  // hardReset: true   → wipe everything including completed tasks (full fresh start)
  const { bookId, regenerate = false, hardReset = false } = await req.json()
  if (!bookId) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 })
  }

  // 3. Fetch the book (must belong to this user)
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single()

  if (bookError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  // 4. Check if any active plans exist for this book (fetch all to handle duplicates)
  const { data: existingPlans } = await supabase
    .from('plans')
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', user.id)
    .eq('status', 'active')

  // Collect tasks to preserve (unless the user explicitly wants a hard reset)
  let completedTasksToPreserve: {
    title: string; description: string; category: string;
    platform_tag: string; estimated_mins: number;
    week_number: number; day_number: number; phase: number;
  }[] = []

  // Custom tasks are always preserved across regenerations (never wiped, even on hardReset)
  let customTasksToPreserve: {
    title: string; description: string; category: string;
    platform_tag: string; estimated_mins: number;
    week_number: number; day_number: number; phase: number;
    is_completed: boolean; completed_at: string | null; points_awarded: boolean;
  }[] = []

  if (existingPlans && existingPlans.length > 0) {
    if (!regenerate && !hardReset) {
      return NextResponse.json({ error: 'A plan already exists for this book' }, { status: 409 })
    }

    // Always save custom tasks before wiping — they survive even a hard reset
    const { data: customTasks } = await supabase
      .from('tasks')
      .select('title, description, category, platform_tag, estimated_mins, week_number, day_number, phase, is_completed, completed_at, points_awarded')
      .in('plan_id', existingPlans.map(p => p.id))
      .eq('is_custom', true)
    customTasksToPreserve = customTasks ?? []

    if (!hardReset) {
      // Save completed AI-generated tasks before wiping so we can restore them after generation
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('title, description, category, platform_tag, estimated_mins, week_number, day_number, phase')
        .in('plan_id', existingPlans.map(p => p.id))
        .eq('is_completed', true)
        .eq('is_custom', false)   // exclude custom tasks — they're handled separately
      completedTasksToPreserve = completedTasks ?? []
    }

    // Delete all existing plans and their tasks
    for (const p of existingPlans) {
      await supabase.from('tasks').delete().eq('plan_id', p.id)
      await supabase.from('plans').delete().eq('id', p.id)
    }
  }

  // 5. Build the author profile and call Claude
  // Note: using FORWORD_ANTHROPIC_KEY (not ANTHROPIC_API_KEY) to avoid conflicts
  // with Claude Code's own environment which sets ANTHROPIC_API_KEY to an empty string.
  const apiKey = process.env.FORWORD_ANTHROPIC_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured. Add FORWORD_ANTHROPIC_KEY to .env.local.' },
      { status: 500 }
    )
  }

  const anthropic = new Anthropic({
    apiKey,
    baseURL: 'https://api.anthropic.com', // explicit — avoid inheriting ANTHROPIC_BASE_URL
  })

  // Merge user-level profile flags into the book record before building the profile JSON.
  // has_agent comes from the users table (author-level, not book-specific).
  const bookWithUserFlags = {
    ...(book as Record<string, unknown>),
    has_agent: profile?.has_agent ?? null,
  }
  const userProfileJson = buildAuthorProfile(bookWithUserFlags)

  let rawOutput: string
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: PLAN_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userProfileJson,
        },
      ],
    })

    // Extract text content from the response
    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response')
    }
    rawOutput = textBlock.text
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json(
      { error: 'Plan generation failed. Please try again.' },
      { status: 500 }
    )
  }

  // 6. Parse Claude's JSON output
  let planData: ClaudePlanOutput
  try {
    // Strip any accidental code fences Claude might have included
    const cleaned = rawOutput.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    planData = JSON.parse(cleaned)
  } catch {
    console.error('JSON parse error — raw output:', rawOutput)
    return NextResponse.json(
      { error: 'Plan generation returned an invalid response. Please try again.' },
      { status: 500 }
    )
  }

  // 7. Derive total task count and plan_type
  const allTasks = planData.phases.flatMap(p => p.tasks)

  // Normalise plan_type to the values allowed by the DB check constraint.
  // Claude may return variations (e.g. "audience-build", "launch_prep") — map them.
  const VALID_PLAN_TYPES = ['foundation', 'audience_build', 'launch_countdown', 'relaunch', 'evergreen']
  function normalizePlanType(raw: string): string {
    const lower = (raw ?? '').toLowerCase().replace(/[-\s]/g, '_')
    if (VALID_PLAN_TYPES.includes(lower)) return lower
    if (lower.includes('foundation'))   return 'foundation'
    if (lower.includes('audience'))     return 'audience_build'
    if (lower.includes('launch'))       return 'launch_countdown'
    if (lower.includes('relaunch') || lower.includes('evergreen')) return lower.includes('evergreen') ? 'evergreen' : 'relaunch'
    // Fall back to stage-derived type
    return planTypeFromStage(book.book_stage as string)
  }
  const planType = normalizePlanType(planData.plan_type)

  // 8. Insert the plan record
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .insert({
      book_id: bookId,
      user_id: user.id,
      cycle_number: 1,
      plan_type: planType,
      total_tasks: allTasks.length,
      completion_pct: 0,
      current_phase: 1,
      status: 'active',
      raw_ai_output: planData,
    })
    .select()
    .single()

  if (planError || !plan) {
    console.error('Plan insert error:', planError)
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
  }

  // 9. Fetch the user's tier + profile flags to determine locking and plan personalisation
  const { data: profile } = await supabase
    .from('users')
    .select('tier, has_agent')
    .eq('id', user.id)
    .single()
  const isStarterTier = !profile?.tier || profile.tier === 'starter'
  const isAuthorTier = profile?.tier === 'author'

  // Author tier: only 1 book can have a fully unlocked plan at a time.
  // If this user already has an active plan with unlocked day-31+ tasks for a DIFFERENT
  // book, this new plan must be locked (day 31+) — locking only changes when the
  // currently-unlocked book is deleted.
  let authorAlreadyHasUnlockedPlan = false
  if (isAuthorTier) {
    const { data: otherPlans } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('book_id', bookId)  // different book only — regenerating same book keeps it unlocked

    if (otherPlans && otherPlans.length > 0) {
      const { data: unlockedTasks } = await supabase
        .from('tasks')
        .select('id')
        .in('plan_id', otherPlans.map(p => p.id))
        .eq('is_locked', false)
        .gt('day_number', 30)
        .limit(1)

      authorAlreadyHasUnlockedPlan = (unlockedTasks?.length ?? 0) > 0
    }
  }

  // Determine final lock rule:
  // - Starter: lock day 31+
  // - Author with another unlocked book: lock day 31+ on this new plan
  // - Author with no other unlocked book, or Pro: unlock everything
  const shouldLockDay31Plus = isStarterTier || (isAuthorTier && authorAlreadyHasUnlockedPlan)

  // Normalise category values to the 6 allowed by the DB check constraint.
  // Claude returns free-form strings like "Content", "Research", "Outreach" etc.
  function normalizeCategory(raw: string): string {
    const lower = (raw ?? '').toLowerCase()
    if (lower.includes('social') || lower.includes('content') || lower.includes('platform') || lower.includes('community') || lower.includes('tiktok') || lower.includes('instagram')) return 'social'
    if (lower.includes('pr') || lower.includes('outreach') || lower.includes('media') || lower.includes('podcast') || lower.includes('press')) return 'pr'
    if (lower.includes('email') || lower.includes('newsletter') || lower.includes('substack')) return 'email'
    if (lower.includes('publish') || lower.includes('kdp') || lower.includes('ingram') || lower.includes('launch')) return 'publishing'
    if (lower.includes('found') || lower.includes('book dev') || lower.includes('manuscript') || lower.includes('writing')) return 'foundation'
    // research, strategy, audience research, planning → planning
    return 'planning'
  }

  // Log raw categories so we can see what Claude returned
  const rawCategories = Array.from(new Set(allTasks.map(t => t.category)))
  console.log('Raw categories from Claude:', rawCategories)
  const normalizedCategories = rawCategories.map(c => `${c} → ${normalizeCategory(c)}`)
  console.log('Normalized:', normalizedCategories)

  // Build a normalised set of the author's selected platform names so we can
  // enforce platform restrictions server-side as a safety net (Claude occasionally
  // slips in platforms the author didn't select despite the prompt rule).
  const bookPlatforms = book.platforms as { active?: string[]; open_to?: string[] } | null
  const selectedPlatforms = [
    ...(bookPlatforms?.active ?? []),
    ...(bookPlatforms?.open_to ?? []),
  ].map(p => p.toLowerCase().replace(/[^a-z0-9]/g, ''))

  // Tags that are always allowed regardless of platform selection (tools, retailers, etc.)
  const genericTags = new Set(['all', 'none', 'general', 'any', 'canva', 'buffer', 'email', 'kdp', 'ingramspark', 'amazon', 'goodreads', 'substack', 'newsletter', 'querytracker', 'publishersmarketplace', 'booksirens', 'netgalley', 'bookstagram', 'booktok'])

  // Platforms that are never selectable in the app and must never appear as
  // engagement destinations in task titles or descriptions.
  const unsupportedPlatformPatterns = [
    /\breddit\b/i,
    /\bsubreddit\b/i,
    /\bdiscord\b/i,
    /\bbluesky\b/i,
    /\bmastodon\b/i,
    /\btumblr\b/i,
    /\bsnapchat\b/i,
    /\bbereal\b/i,
    /\btelegram\b/i,
    /\bwhatsapp\b/i,
  ]

  // Returns true if the platform_tag is in the author's selection or is generic
  function isPlatformTagAllowed(tag: string): boolean {
    if (!tag) return true
    const normalised = tag.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (genericTags.has(normalised)) return true
    return selectedPlatforms.some(p => p.includes(normalised) || normalised.includes(p))
  }

  // Returns true if the task text contains an engagement reference to an unsupported platform.
  // We allow purely passive/research mentions (e.g. "read r/fantasy to understand readers")
  // but block action-oriented phrases like "post on Reddit", "join a subreddit", etc.
  function containsUnsupportedPlatformEngagement(text: string): boolean {
    const engagementVerbs = /\b(post|comment|join|engage|build|grow|share|reply|message|dm|participate|contribute)\b/i
    for (const pattern of unsupportedPlatformPatterns) {
      if (pattern.test(text) && engagementVerbs.test(text)) return true
    }
    return false
  }

  // 10. Insert all task records
  const taskRows = allTasks.map(task => {
    const tagAllowed = isPlatformTagAllowed(task.platform_tag)
    const descriptionClean = !containsUnsupportedPlatformEngagement(task.title + ' ' + task.description)

    if (!tagAllowed) {
      console.warn(`Platform filter [tag]: "${task.title}" had platform_tag "${task.platform_tag}" not in author's selected platforms — resetting to "all"`)
    }
    if (!descriptionClean) {
      console.warn(`Platform filter [description]: "${task.title}" references an unsupported platform engagement — flagged for review`)
    }

    return {
      plan_id: plan.id,
      user_id: user.id,
      phase: planData.phases.find(p => p.tasks.includes(task))?.phase_number ?? 1,
      week_number: task.week_number,
      day_number: task.day_number,
      title: task.title,
      description: task.description,
      category: normalizeCategory(task.category),
      platform_tag: tagAllowed ? task.platform_tag : 'all',
      estimated_mins: task.estimated_mins,
      is_completed: false,
      is_locked: shouldLockDay31Plus && task.day_number > 30,
    }
  })

  const { error: tasksError } = await supabase.from('tasks').insert(taskRows)

  if (tasksError) {
    console.error('Tasks insert error:', tasksError)
    await supabase.from('plans').delete().eq('id', plan.id)
    return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 })
  }

  // 11. Restore previously completed tasks (preserving user progress)
  // Match by day_number and UPDATE the newly-generated task in place — never insert
  // duplicate rows, which would cause tasks to appear twice in the plan view.
  if (completedTasksToPreserve.length > 0) {
    const completedDays = completedTasksToPreserve.map(t => t.day_number)
    const { error: restoreError } = await supabase
      .from('tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('plan_id', plan.id)
      .in('day_number', completedDays)

    if (restoreError) console.error('Failed to restore completed tasks:', restoreError)

    // Recalculate completion_pct based on the actual updated rows
    const { data: updatedTasks } = await supabase
      .from('tasks')
      .select('is_completed, is_locked')
      .eq('plan_id', plan.id)

    if (updatedTasks) {
      const unlocked = updatedTasks.filter(t => !t.is_locked)
      const completedCount = unlocked.filter(t => t.is_completed).length
      const pct = unlocked.length > 0 ? Math.round((completedCount / unlocked.length) * 100) : 0
      await supabase.from('plans').update({ completion_pct: pct }).eq('id', plan.id)
    }
  }

  // 12. Re-insert custom tasks, clamping week numbers to the new plan's phase structure
  if (customTasksToPreserve.length > 0) {
    // Build a phase → max week map from the newly inserted AI tasks
    const phaseMaxWeekMap = new Map<number, number>()
    for (const row of taskRows) {
      const current = phaseMaxWeekMap.get(row.phase) ?? 0
      if (row.week_number > current) phaseMaxWeekMap.set(row.phase, row.week_number)
    }
    const globalMaxWeek = phaseMaxWeekMap.size > 0
      ? Math.max(...Array.from(phaseMaxWeekMap.values()))
      : 1

    for (const customTask of customTasksToPreserve) {
      // Clamp to the max week in the task's original phase; fall back to global max
      const maxWeekInPhase = phaseMaxWeekMap.get(customTask.phase) ?? globalMaxWeek
      const clampedWeek = Math.min(customTask.week_number, maxWeekInPhase)

      // Slot at the end of the clamped week (after all newly inserted AI tasks)
      const tasksInTargetWeek = taskRows.filter(t => t.week_number === clampedWeek)
      const maxDay =
        tasksInTargetWeek.length > 0
          ? Math.max(...tasksInTargetWeek.map(t => t.day_number))
          : (clampedWeek - 1) * 7

      const { error: customInsertErr } = await supabase.from('tasks').insert({
        plan_id: plan.id,
        user_id: user.id,
        phase: customTask.phase,
        week_number: clampedWeek,
        day_number: maxDay + 1,
        title: customTask.title,
        description: customTask.description,
        category: customTask.category,
        platform_tag: customTask.platform_tag,
        estimated_mins: customTask.estimated_mins,
        is_completed: customTask.is_completed,
        completed_at: customTask.completed_at,
        points_awarded: customTask.points_awarded ?? false,
        is_locked: false,
        is_custom: true,
      })

      if (customInsertErr) console.error('Failed to restore custom task:', customTask.title, customInsertErr)
    }
  }

  return NextResponse.json({
    planId: plan.id,
    success: true,
    preservedTasks: completedTasksToPreserve.length,
    preservedCustomTasks: customTasksToPreserve.length,
  })
}
