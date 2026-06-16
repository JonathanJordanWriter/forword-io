import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorProfile } from '@/lib/prompts/build-profile'

const anthropic = new Anthropic({
  apiKey: process.env.FORWORD_ANTHROPIC_KEY,
  baseURL: 'https://api.anthropic.com',
})

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = params

  // ── 1. Fetch the task being replaced ──────────────────────────────────────
  const { data: task } = await supabase
    .from('tasks')
    .select('id, plan_id, user_id, phase, week_number, day_number, category, platform_tag, is_locked, is_completed')
    .eq('id', taskId)
    .single()

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (task.is_locked) return NextResponse.json({ error: 'Cannot replace a locked task' }, { status: 403 })
  if (task.is_completed) return NextResponse.json({ error: 'Cannot replace a completed task' }, { status: 400 })

  // ── 2. Fetch book profile via plan → book chain ────────────────────────────
  const { data: plan } = await supabase
    .from('plans')
    .select('book_id')
    .eq('id', task.plan_id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', plan.book_id)
    .single()

  if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })

  // ── 3. Fetch other task titles in the same week (to avoid repeats) ─────────
  const { data: weekTasks } = await supabase
    .from('tasks')
    .select('title')
    .eq('plan_id', task.plan_id)
    .eq('week_number', task.week_number)
    .neq('id', taskId)

  const existingTitles = (weekTasks ?? []).map(t => t.title)

  // ── 4. Build targeted Claude prompt ────────────────────────────────────────
  const authorProfile = buildAuthorProfile(book as Record<string, unknown>)

  const systemPrompt = `You are an expert author marketing strategist.
Generate exactly ONE replacement marketing task for an author's 90-day marketing plan.

You will receive an author profile JSON plus context about where in the plan this task lives.
Return ONLY a valid JSON object — no prose, no markdown, no code fences.

Output schema:
{
  "title": string (max 80 chars — specific and actionable, not generic),
  "description": string (max 200 chars — concrete next steps, not vague advice),
  "category": string (one of: planning, foundation, social, email, pr, publishing),
  "platform_tag": string (a platform from the author's active/open_to list, or "all"),
  "estimated_mins": number (realistic time in minutes: 10, 15, 20, 30, 45, 60, 90, or 120)
}

Rules:
- The task must be genuinely different in type from the titles listed in existing_week_tasks
- Respect the author's platforms — only suggest a platform they have listed as active or open_to
- Respect budget — if monthly_budget is 0_50, never suggest paid advertising
- Respect kdp_select gating — if kdp_select is false, never suggest KDP Select features
- Match the phase context: Phase 1 = foundation/setup, Phase 2 = audience building, Phase 3 = pre-launch, Phase 4 = launch, Phase 5 = post-launch/evergreen
- Be specific: reference the author's actual genre, book type, or platform by name
- Never generate a task that asks the author to add their own book to a Goodreads list
- Any task involving online communities must emphasize adding value, not self-promotion`

  const userMessage = `Author profile:
${authorProfile}

Task context:
- Phase: ${task.phase}
- Week: ${task.week_number}
- Preferred category (can suggest a different one if a better fit exists): ${task.category}
- Preferred platform (can suggest a different one from the author's list if better): ${task.platform_tag}

Tasks already in this week (do NOT repeat these task types):
${existingTitles.length > 0 ? existingTitles.map(t => `- ${t}`).join('\n') : '(none yet)'}

Generate one fresh, specific, actionable replacement task.`

  // ── 5. Call Claude ─────────────────────────────────────────────────────────
  let replacementTask: {
    title: string
    description: string
    category: string
    platform_tag: string
    estimated_mins: number
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Strip any accidental markdown fences
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    replacementTask = JSON.parse(jsonText)

    // Basic validation
    if (!replacementTask.title || !replacementTask.description || !replacementTask.category) {
      throw new Error('Incomplete task returned from Claude')
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('Task replacement Claude error:', detail)
    return NextResponse.json({ error: 'Failed to generate replacement task', detail }, { status: 500 })
  }

  // ── 6. Update the task row in place ───────────────────────────────────────
  // Setting is_custom: true means it will survive plan regeneration (same as user-added tasks)
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update({
      title: replacementTask.title,
      description: replacementTask.description,
      category: replacementTask.category,
      platform_tag: replacementTask.platform_tag ?? 'all',
      estimated_mins: replacementTask.estimated_mins ?? 30,
      is_custom: true, // survives regeneration
    })
    .eq('id', taskId)
    .select()
    .single()

  if (updateError || !updatedTask) {
    console.error('Task replace update error:', updateError)
    return NextResponse.json({ error: 'Failed to save replacement task' }, { status: 500 })
  }

  return NextResponse.json({ success: true, task: updatedTask })
}
