import { OnboardingData } from '@/lib/types'

interface Props {
  data: OnboardingData
  onSubmit: () => void
  onBack: () => void
  onEditStep: (step: number) => void
  loading: boolean
  error: string | null
}

const STAGE_LABELS: Record<string, string> = {
  idea: 'Just an idea', outlining: 'Outlining', still_writing: 'Writing',
  finished_manuscript: 'Finished manuscript', beta_reading: 'Beta reading',
  revision: 'In revision', querying: 'Querying', editing: 'Developmental edit',
  line_edit: 'Line edit', cover_design: 'Cover & production',
  proofreading: 'Proofreading', published: 'Already published',
}

const GOAL_LABELS: Record<string, string> = {
  build_readership: 'Build my readership', sell_copies: 'Sell more copies',
  attract_agent: 'Attract a literary agent', build_authority: 'Build authority',
  relaunch: 'Relaunch backlist', audiobook: 'Market an audiobook',
}

const TIME_LABELS: Record<string, string> = {
  '1_2hrs': '1–2 hours/week', '3_5hrs': '3–5 hours/week', '6_10hrs': '6–10 hours/week',
}

const BUDGET_LABELS: Record<string, string> = {
  '0_50': '$0–50/month', '50_200': '$50–200/month', '200_plus': '$200+/month',
}

const PATH_LABELS: Record<string, string> = {
  self: 'Self-publishing', traditional: 'Traditional', hybrid: 'Hybrid', undecided: 'Undecided',
}

const TIMEFRAME_LABELS: Record<string, string> = {
  within_12mo: 'Within 12 months', '12_18mo': '12–18 months',
  '1_2yr': '1–2 years', '2yr_plus': '2+ years',
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
      </div>
      <button type="button" onClick={onEdit}
        className="text-xs text-brand-button hover:underline ml-4 shrink-0 mt-1">
        Edit
      </button>
    </div>
  )
}

export default function Step6Review({ data, onSubmit, onBack, onEditStep, loading, error }: Props) {
  const compList = data.comp_titles.filter(c => c.title).map(c => `${c.title} by ${c.author}`).join(', ')
  const rankedGoals = data.goals_ranked.map((g, i) => `${i + 1}. ${GOAL_LABELS[g] ?? g}`).join('  ·  ')

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">Review your profile</h2>
      <p className="text-gray-500 text-sm mb-6">
        Check everything looks right. We&apos;ll generate your personalized plan paced to your schedule — your first 30 days are free.
      </p>

      <div className="bg-gray-50 rounded-xl px-4 mb-6">
        <ReviewRow label="Book stage" value={STAGE_LABELS[data.book_stage] ?? ''} onEdit={() => onEditStep(1)} />
        <ReviewRow
          label="Book type & genres"
          value={[data.book_type, ...(data.genres.length ? [data.genres.join(', ')] : []), data.subgenre].filter(Boolean).join(' · ')}
          onEdit={() => onEditStep(2)}
        />
        <ReviewRow label="Comp titles" value={compList || 'None added'} onEdit={() => onEditStep(3)} />
        <ReviewRow label="Goals (ranked)" value={rankedGoals || '—'} onEdit={() => onEditStep(4)} />
        <ReviewRow
          label="Platforms"
          value={[
            data.platforms.active.length ? `Active: ${data.platforms.active.join(', ')}` : '',
            data.platforms.open_to.length ? `Exploring: ${data.platforms.open_to.join(', ')}` : '',
          ].filter(Boolean).join('  ·  ') || 'None selected'}
          onEdit={() => onEditStep(4)}
        />
        <ReviewRow label="Time per week" value={TIME_LABELS[data.time_per_week] ?? ''} onEdit={() => onEditStep(5)} />
        <ReviewRow label="Monthly budget" value={BUDGET_LABELS[data.monthly_budget] ?? ''} onEdit={() => onEditStep(5)} />
        <ReviewRow label="Publishing path" value={PATH_LABELS[data.publishing_path] ?? ''} onEdit={() => onEditStep(5)} />
        {data.launch_timeframe && (
          <ReviewRow label="Launch timeframe" value={TIMEFRAME_LABELS[data.launch_timeframe] ?? ''} onEdit={() => onEditStep(5)} />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button type="button" onClick={onSubmit} disabled={loading}
          className="flex-1 py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
          {loading ? 'Saving…' : 'Save & go to my plan →'}
        </button>
      </div>
    </div>
  )
}
