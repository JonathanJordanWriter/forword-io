// ── User profile (collected in onboarding Step 1) ────────────────────────────

// Tools an author may already have — shared between user profile and book onboarding
export const AUTHOR_TOOLS: { value: string; label: string }[] = [
  { value: 'canva',                   label: 'Canva' },
  { value: 'buffer',                  label: 'Buffer' },
  { value: 'later',                   label: 'Later' },
  { value: 'mailchimp',               label: 'Mailchimp' },
  { value: 'kit',                     label: 'Kit (ConvertKit)' },
  { value: 'hootsuite',               label: 'Hootsuite' },
  { value: 'bookfunnel',              label: 'BookFunnel' },
  { value: 'substack',                label: 'Substack' },
  { value: 'arc_service',             label: 'ARC service (NetGalley, BookSirens, etc.)' },
  { value: 'querytracker',            label: 'QueryTracker' },
  { value: 'publishers_marketplace',  label: 'Publishers Marketplace' },
]

export interface UserProfileData {
  display_name: string        // required — pen name / display name
  identities: string[]        // required — at least one chip selected
  birthdate: string           // optional — YYYY-MM-DD
  gender: string              // optional — Male | Female | Non-binary
  nationality: string         // optional — country
  location: string            // optional — city, state/country
  writing_experience: string  // optional
  publishing_goals: string[]  // optional
  heard_from: string          // optional
  profile_photo_url: string   // optional — set after storage upload
  existing_tools: string[]    // optional — tools already in use across all books
  has_agent: boolean | null   // null = not answered; true = has representation; false = no agent
}

export const EMPTY_USER_PROFILE: UserProfileData = {
  display_name: '',
  identities: [],
  birthdate: '',
  gender: '',
  nationality: '',
  location: '',
  writing_experience: '',
  publishing_goals: [],
  heard_from: '',
  profile_photo_url: '',
  existing_tools: [],
  has_agent: null,
}

// ── Book types ────────────────────────────────────────────────────────────────

export type BookType = 'fiction' | 'nonfiction'

export type BookStage =
  | 'idea' | 'outlining' | 'still_writing' | 'finished_manuscript' | 'beta_reading'
  | 'revision' | 'querying' | 'editing' | 'line_edit' | 'cover_design' | 'proofreading' | 'published'

export type PublishingPath = 'self' | 'traditional' | 'hybrid' | 'undecided'

export type PrimaryGoal = 'build_readership' | 'sell_copies' | 'attract_agent' | 'relaunch' | 'audiobook' | 'build_authority'

export type TimePerWeek = '1_2hrs' | '3_5hrs' | '6_10hrs'

export type MonthlyBudget = '0_50' | '50_200' | '200_plus'

export type ExperienceLevel = 'first_time' | 'mid_career' | 'established'

export type ExistingAudience = 'under_500' | '500_2k' | '2k_10k' | '10k_plus'

// Launch timeframe ranges instead of exact date
export type LaunchTimeframe = 'within_12mo' | '12_18mo' | '1_2yr' | '2yr_plus' | 'already_published'

export interface CompTitle {
  title: string
  author: string
}

export interface IdealReader {
  age_ranges: string[]
  interests: string[]
  comp_authors: string
}

export interface Platforms {
  active: string[]      // platforms they currently use
  open_to: string[]     // platforms they're open to exploring
  recommended: string[] // filled by Claude API recommendation (future)
}

export interface OnboardingData {
  // Step 1
  book_stage: BookStage | ''
  // Step 2 — multi-select genres
  book_type: BookType | ''
  genres: string[]      // array — user can select multiple
  subgenre: string      // free-text custom entry
  writes_multiple_genres: boolean  // true = author spans multiple genres; avoids genre-specific bio tasks
  // Step 3
  title: string
  comp_titles: CompTitle[]
  // Step 4 — ranked goals (index 0 = #1 priority)
  goals_ranked: PrimaryGoal[]
  ideal_reader: IdealReader
  platforms: Platforms
  // Step 5
  time_per_week: TimePerWeek | ''
  monthly_budget: MonthlyBudget | ''
  experience_level: ExperienceLevel | ''
  existing_audience: ExistingAudience | ''
  publishing_path: PublishingPath | ''
  launch_timeframe: LaunchTimeframe | ''
  kdp_select: boolean | null  // null = not asked (non-published stages); true/false = user answered
  book_tools: string[]        // tools in use for this specific book (pre-seeded from user existing_tools)
}

export const EMPTY_ONBOARDING: OnboardingData = {
  book_stage: '',
  book_type: '',
  genres: [],
  subgenre: '',
  writes_multiple_genres: false,
  title: '',
  comp_titles: [],
  goals_ranked: [],
  ideal_reader: { age_ranges: [], interests: [], comp_authors: '' },
  platforms: { active: [], open_to: [], recommended: [] },
  time_per_week: '',
  monthly_budget: '',
  experience_level: '',
  existing_audience: '',
  publishing_path: '',
  launch_timeframe: '',
  kdp_select: null,
  book_tools: [],
}
