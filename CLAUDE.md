# forword.io — CLAUDE.md Project Brief

This file is the persistent memory for all Claude Code sessions on this project. Read it fully before every session. Never deviate from the stack, naming, or logic defined here without explicit instruction from the project owner.

---

## 1\. Product Overview

**App name:** forword.io **Tagline:** Move your book forward. **What it is:** A browser-first SaaS web app that generates a personalized 90-day marketing plan for authors based on their book, goals, genre, ideal reader, platform preferences, and available time and budget. **Domain:** forword.io (Vercel deployment) **Owner:** Non-technical solo founder. Write code that is readable, well-commented, and structured so a future technical co-founder can onboard quickly.

---

## 2\. Core User Problem

Aspiring and published authors know they need to market their books but feel overwhelmed, don't know where to start, post in the wrong places, burn out, or abandon their marketing efforts entirely. forword.io solves this by generating a step-by-step personalized plan, delivering daily post prompts, and adapting the plan over time so it never becomes a source of shame or guilt.

---

## 3\. Tech Stack — Do Not Deviate Without Permission

| Layer | Choice | Notes |
| :---- | :---- | :---- |
| Framework | Next.js 14 (App Router) | Web-first, React-based, Vercel-native |
| Language | TypeScript | Strict mode enabled |
| Styling | Tailwind CSS | Utility-first, no CSS modules |
| Database | Supabase (PostgreSQL) | Auth \+ DB \+ Storage |
| Auth | Supabase Auth | Email/password \+ Google OAuth |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Plan generation, genre advisor, comp checker |
| Payments | Stripe | Subscriptions \+ webhooks |
| Email | Resend | Transactional email only |
| Hosting | Vercel | Auto-deploy from GitHub main branch |
| Calendar export | Custom .ics generation | Server-side, no third-party library needed |
| Push/notifications | In-app only for MVP | Email reminders via Resend |
| Package manager | npm | Not yarn or pnpm |

---

## 4\. Subscription Tiers

### Starter (Free)

- Full 6-step onboarding quiz  
- Genre advisor with conflict warnings  
- Comp title checker (3 checks maximum)  
- Platform recommendation engine  
- **Up to 2 books** (enforced at book creation)  
- First 30 days of each generated plan (tasks beyond day 30 are blurred)  
- **3 post prompts per week** (resets every Monday — 12 total over the free period)  
- No .ics calendar export  
- No adaptive plan / burnout guard

### Author ($9/month)

- Everything in Starter  
- **Unlimited books**  
- **1 book of their choice gets a full 90-day plan** (user selects by upgrading from that book's page)  
- All other books get 30-day plans (same as Starter)  
- User can switch which book has the 90-day plan **once per calendar month**  
- Unlimited comp title checks  
- .ics calendar export of full plan  
- Adaptive plan with burnout guard and weekly check-ins  
- Recurring 90-day cycles (post-launch, evergreen, book 2\)  
- Full post prompt library (200+ prompts)  
- Platform-specific prompt packs  
- Done-for-you outreach templates (podcast pitch, ARC, book club kit)

### Author Pro ($19/month)

- Everything in Author  
- **All books get full 90-day plans — no restrictions**  
- 1 VA / collaborator seat  
- Series marketing planner  
- Backlist relaunch plans  
- Audiobook marketing plan  
- Progress analytics dashboard  
- Export plan as PDF or shareable link

### Add-on Packs ($7–14, one-time)

- Genre-specific packs with 30 extra prompts \+ templates  
- Available: BookTok, Substack, Podcast Tour, Book Club, Romance/Romantasy, Memoir/Self-help, KDP/Self-pub Launch, Query Letter/Agent

---

## 5\. Database Schema

### users (managed by Supabase Auth \+ profile extension)

```
id              uuid PRIMARY KEY (from auth.users)
email           text
full_name       text
stripe_customer_id  text
tier            text DEFAULT 'starter' -- 'starter' | 'author' | 'pro'
tier_expires_at timestamptz
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### books

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
title           text
book_type       text   -- 'fiction' | 'nonfiction' | 'poetry' | 'childrens' | 'ya' | 'graphic_novel' | 'anthology'
genre           text   -- e.g. 'womens_fiction', 'memoir', 'romantasy'
subgenre        text   -- free text, optional
publishing_path text   -- 'self' | 'traditional' | 'hybrid'
book_stage      text   -- see Stage enum below
launch_date     date
comp_titles     jsonb  -- array of {title, author, year, similarity_type}
primary_goal    text   -- 'build_readership' | 'sell_copies' | 'attract_agent' | 'relaunch' | 'audiobook'
ideal_reader    jsonb  -- {age_ranges, interests, comp_authors}
platforms       jsonb  -- {active: [], open_to: [], recommended: []}
time_per_week   text   -- '1_2hrs' | '3_5hrs' | '6_10hrs'
monthly_budget  text   -- '0_50' | '50_200' | '200_plus'
experience_level text  -- 'first_time' | 'mid_career' | 'established'
existing_audience text -- 'under_500' | '500_2k' | '2k_10k' | '10k_plus'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Book stage enum (stored as text)

```
idea | still_writing | finished_manuscript | beta_reading |
revision | editing | cover_design | published
```

### plans

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
book_id         uuid REFERENCES books(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
cycle_number    integer DEFAULT 1  -- increments each 90-day cycle
plan_type       text  -- 'foundation' | 'audience_build' | 'launch_countdown' | 'relaunch' | 'evergreen'
generated_at    timestamptz DEFAULT now()
total_tasks     integer
completion_pct  integer DEFAULT 0
current_phase   integer DEFAULT 1
status          text DEFAULT 'active'  -- 'active' | 'completed' | 'archived'
raw_ai_output   jsonb  -- store the full Claude response for debugging
```

### tasks

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
plan_id         uuid REFERENCES plans(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
phase           integer  -- 1–5
week_number     integer
day_number      integer  -- 1–90
title           text
description     text
category        text  -- 'social' | 'pr' | 'email' | 'publishing' | 'foundation' | 'planning'
platform_tag    text  -- 'instagram' | 'substack' | 'podcast' | 'goodreads' | 'all' etc.
estimated_mins  integer
is_completed    boolean DEFAULT false
completed_at    timestamptz
is_locked       boolean DEFAULT false  -- true for day 31+ on Starter tier
notes           text
created_at      timestamptz DEFAULT now()
```

### post\_prompts

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
category        text   -- 'character_spotlight' | 'reader_engagement' | 'writing_life' |
                        -- 'contrarian_take' | 'origin_story' | 'social_proof' |
                        -- 'book_world' | 'value_perspective' | 'promotional'
book_type       text   -- 'fiction' | 'nonfiction' | 'both'
platform        text   -- 'instagram' | 'tiktok' | 'substack' | 'facebook' | 'goodreads' | 'threads' | 'any'
prompt_text     text
why_it_works    text
do_tip          text
dont_tip        text
is_promotional  boolean DEFAULT false
stage_relevance text[] -- which book stages this prompt suits
tier_required   text DEFAULT 'starter'  -- 'starter' | 'author' | 'pro'
```

### user\_prompts (tracking weekly usage)

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
book_id         uuid REFERENCES books(id) ON DELETE CASCADE
prompt_id       uuid REFERENCES post_prompts(id)
week_start      date   -- Monday of the week this was served
action          text   -- 'served' | 'saved' | 'skipped' | 'done'
created_at      timestamptz DEFAULT now()
```

### weekly\_checkins

```
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
plan_id         uuid REFERENCES plans(id) ON DELETE CASCADE
week_number     integer
energy_rating   integer  -- 1–5 (burnout guard input)
tasks_completed integer
tasks_skipped   integer
load_adjustment text  -- 'reduced' | 'normal' | 'increased'
created_at      timestamptz DEFAULT now()
```

---

## 6\. Onboarding Flow (6 Steps)

All onboarding answers save to the `books` table on completion of step 6\. Do not save partial state to the database — use React state until the final step, then write everything in a single Supabase insert.

### Step 1 — Book production stage

Single select from 8 options. This determines the plan\_type generated. Stage → Plan type mapping:

- idea, still\_writing → foundation  
- finished\_manuscript, beta\_reading → audience\_build  
- revision, editing → audience\_build  
- cover\_design → launch\_countdown  
- published → relaunch (with sub-options: relaunch / audiobook / second\_edition)

### Step 2a — Book type (top level)

Fiction | Nonfiction | Poetry | Children's | YA / Middle grade | Graphic novel | Anthology

### Step 2b — Genre (second level, chip selection)

Fiction genres: Literary fiction, Romance, Romantasy, Thriller/suspense, Mystery/cozy mystery, Horror, Fantasy (epic), Fantasy (urban), Sci-fi, Historical fiction, Women's fiction, Contemporary fiction, Paranormal, Adventure/action, Erotica/dark romance

Nonfiction genres: Memoir/personal essay, Self-help/personal growth, Business/leadership, Health & wellness, Parenting/family, Spirituality/faith, True crime, History/biography, Science/nature, Politics/current events, Finance/investing, Cookbooks/food, Education/academic, Travel, Humor/essay

Free text field for custom genre entry. If custom text is entered:

- Run genre analysis via Claude API  
- Check against known retail categories  
- Show conflict warning if the genre has no retail shelf or is too niche  
- Offer 2–3 suggested alternative genres with reasoning

### Step 3 — Comp titles

Up to 3 comp title entries (title \+ author name). Validate each against rules:

- Published within last 5 years (flag if older)  
- Not a mega-bestseller franchise (flag Harry Potter, Twilight, Hunger Games etc.)  
- Same format as the user's book Offer "Help me find comps" path with 4 sub-questions.

### Step 4 — Goals \+ ideal reader \+ platforms

Primary goal selection (single select) Ideal reader: age ranges (multi-select), interests (chips), comp authors (free text) Platform selection with "Recommend for me" option If "Recommend for me": call Claude API with genre \+ ideal reader data, return ranked platform recommendations with genre-specific reasoning

### Step 5 — Capacity

Time per week (single select) Monthly budget (single select) Marketing comfort zone (multi-select from list) Experience level (single select) Existing audience size (single select)

### Step 6 — Review \+ generate

Show summary of all inputs. Allow back-navigation to edit any step. "Generate my plan" button triggers plan generation API call. Show animated loading state while Claude generates the plan (5–15 seconds).

---

## 7\. Plan Generation — Claude API Prompt Architecture

### API call configuration

```ts
model: "claude-sonnet-4-20250514"
max_tokens: 4096
system: [see system prompt below]
messages: [{ role: "user", content: [assembled user profile JSON] }]
```

### System prompt (store in /lib/prompts/plan-generation.ts)

```
You are an expert author marketing strategist. You generate personalized,
actionable 90-day marketing plans for authors.

You will receive a JSON object containing an author's complete profile.
You must return ONLY a valid JSON object matching the schema below.
Do not include any prose, explanation, markdown, or code fences.
Return only the raw JSON object.

Output schema:
{
  "plan_type": string,
  "total_tasks": number,
  "phases": [
    {
      "phase_number": number (1-5),
      "title": string,
      "description": string,
      "week_start": number,
      "week_end": number,
      "tasks": [
        {
          "day_number": number (1-90),
          "week_number": number (1-13),
          "title": string (max 80 chars),
          "description": string (max 200 chars),
          "category": string,
          "platform_tag": string,
          "estimated_mins": number
        }
      ]
    }
  ]
}

Rules for task generation:
- Maximum tasks per week = time_per_week mapped as: 1_2hrs→2, 3_5hrs→3, 6_10hrs→5
- Only include tasks for platforms listed in the author's active or open_to arrays
- If budget is 0_50, never include paid advertising tasks
- If experience_level is first_time, add brief how-to context in task descriptions
- If publishing_path is self, include KDP/IngramSpark setup tasks; omit query letter tasks
- If publishing_path is traditional, include query letter and agent research tasks; omit KDP tasks
- Promotional tasks must not exceed 10% of total tasks (25% during launch week only)
- Tasks must be specific and actionable, never generic
- Tasks must reference the author's actual genre, platforms, and comp titles by name
- Never repeat the same task type more than once per week
- Sunday is always a rest day — no tasks on day 7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84
```

### User profile assembly (store in /lib/prompts/build-profile.ts)

Assemble all onboarding fields into a clean JSON object before sending to Claude. Include: book\_title, book\_type, genre, subgenre, publishing\_path, book\_stage, launch\_date, comp\_titles, primary\_goal, ideal\_reader, platforms, time\_per\_week, monthly\_budget, experience\_level, existing\_audience

---

## 8\. Post Prompt Engine

### Weekly prompt allocation

- Starter tier: 3 prompts per week, resets every Monday  
- Author/Pro tier: unlimited access to full library

### Prompt selection logic

1. Filter by user's book\_type (fiction/nonfiction)  
2. Filter by user's active platforms  
3. Filter by current book\_stage  
4. Exclude promotional prompts if user has used a promotional prompt in the last 3 days  
5. Prioritize prompts the user has not yet seen  
6. Weight by content\_balance rules:  
   - Reader connection: 30%  
   - Author/writing life: 25%  
   - Book world: 20%  
   - Value/perspective: 20%  
   - Promotional: max 10% (never two consecutive days)

### Weekly reset

Run a Supabase Edge Function every Monday at 6am UTC. Reset the weekly prompt counter for all Starter users. Do not delete prompt history — only reset the count for the current week.

---

## 9\. .ics Calendar Export

Endpoint: GET /api/export/ics?plan\_id={id} Authentication required. Tier check: Author or Pro tier only. Return 403 for Starter users.

Generate a standard .ics file containing:

- One VEVENT per task in the plan  
- DTSTART based on the task's day\_number offset from plan creation date  
- SUMMARY \= task title  
- DESCRIPTION \= task description \+ "Open in forword.io: \[deep link\]"  
- VALARM (reminder) set to 9am on the task day  
- ORGANIZER \= [noreply@forword.io](mailto:noreply@forword.io)  
- PRODID \= \-//forword.io//Author Marketing Plan//EN

Return as application/octet-stream with Content-Disposition: attachment; filename="forword-plan.ics"

---

## 10\. Stripe Integration

### Products to create in Stripe Dashboard

- Price ID for Author Monthly ($9/mo)  
- Price ID for Author Annual ($86/yr — save \~20%)  
- Price ID for Pro Monthly ($19/mo)  
- Price ID for Pro Annual ($182/yr — save \~20%)  
- One-time prices for each add-on pack

### Webhook events to handle (endpoint: /api/webhooks/stripe)

```
customer.subscription.created  → update user tier to 'author' or 'pro'
customer.subscription.updated  → update tier if plan changes
customer.subscription.deleted  → downgrade user tier to 'starter'
invoice.payment_failed          → send payment failed email via Resend
invoice.payment_succeeded       → send receipt email via Resend
```

### Feature gating middleware

Create a utility function checkTier(userId, requiredTier) that:

1. Reads user.tier from Supabase  
2. Returns boolean  
3. Used in API routes and page components to gate features

Tier hierarchy: starter \< author \< pro A Pro user passes all Author checks.

---

## 11\. Key Pages and Routes

```
/                       Landing page (public)
/signup                 Sign up page
/login                  Login page
/onboarding             6-step onboarding wizard (auth required)
/dashboard              Main plan view with checklist (auth required)
/dashboard/prompts      Post prompt library and daily prompts
/dashboard/calendar     Calendar view of plan tasks
/dashboard/settings     Account settings, billing, notification prefs
/api/generate-plan      POST — triggers Claude plan generation
/api/export/ics         GET — generates and downloads .ics file
/api/webhooks/stripe    POST — handles Stripe webhook events
/api/genre-advisor      POST — Claude call for custom genre analysis
/api/comp-checker       POST — Claude call for comp title validation
/api/platform-recs      POST — Claude call for platform recommendations
```

---

## 12\. Environment Variables

Store all secrets in .env.local (never commit to git). Add to Vercel environment variables for production.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://forword.io
```

---

## 13\. Naming and Code Conventions

- Components: PascalCase (OnboardingStep1.tsx)  
- Utilities and hooks: camelCase (useCurrentUser.ts, formatTaskDate.ts)  
- API routes: kebab-case (/api/generate-plan)  
- Database columns: snake\_case (created\_at, book\_stage)  
- All user-facing copy uses the brand name "forword.io" (lowercase with .io)  
- The tagline is "Move your book forward."  
- Never refer to the app as "ForWord Writing" or "ForWord Writers" in UI copy (those are the Etsy/domain brand assets — this is the app brand)

---

## 14\. What NOT to Build in MVP

Do not build any of the following until explicitly instructed:

- Mobile app (React Native / Expo) — web-first only  
- Google Calendar OAuth sync — .ics export only  
- Instagram / TikTok / Threads posting integrations  
- In-app messaging or community features  
- A/B testing infrastructure  
- Admin dashboard (use Supabase Studio directly)  
- Analytics beyond Stripe MRR and Supabase row counts  
- VA / collaborator seat sharing (Pro feature, v2)  
- PDF plan export (Pro feature, v2)  
- Add-on pack purchasing flow (v2)

---

## 15\. First Session Checklist

When starting the very first Claude Code session, complete these in order:

1. Initialize Next.js 14 project with TypeScript and Tailwind  
2. Connect to Supabase — install @supabase/supabase-js and @supabase/ssr  
3. Create all database tables from Section 5 schema  
4. Set up Supabase Auth with email/password  
5. Create the 6-step onboarding wizard UI (no API calls yet — just the screens)  
6. Verify the onboarding flow saves correctly to the books table  
7. Only then begin the plan generation API integration

Do not skip ahead to payments or plan generation until auth and onboarding are stable.  
