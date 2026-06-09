import { OnboardingData, TimePerWeek, MonthlyBudget, ExperienceLevel, ExistingAudience, PublishingPath, LaunchTimeframe } from '@/lib/types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

// Approximate task counts shown next to the time selector — keeps expectations honest.
// These reflect the updated prompt rules that split compound tasks at lower time settings.
const TASK_ESTIMATES: Record<string, string> = {
  '1_2hrs': '~12–15 focused tasks',
  '3_5hrs': '~18–22 focused tasks',
  '6_10hrs': '~25–30 focused tasks',
}

// Reusable chip-row for single-select options
function OptionRow<T extends string>({
  label, sublabel, options, value, onChange,
}: {
  label: string
  sublabel?: string
  options: { value: T; label: string }[]
  value: T | ''
  onChange: (v: T) => void
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 mb-0.5">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{sublabel}</p>}
      {!sublabel && <div className="mb-2" />}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              value === opt.value
                ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                : 'border-gray-200 text-gray-600 hover:border-brand-accent'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Step5Capacity({ data, onChange, onNext, onBack }: Props) {
  const canProceed =
    data.time_per_week &&
    data.monthly_budget &&
    data.experience_level &&
    data.existing_audience &&
    data.publishing_path

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">Your capacity</h2>
      <p className="text-gray-500 text-sm mb-6">
        This shapes how demanding your plan is. Be honest — a realistic plan beats an ambitious one you abandon.
      </p>

      {/* Time per week — inline so we can show the live task-count estimate */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Time available per week for marketing
        </p>
        <div className="flex flex-wrap gap-2">
          {(['1_2hrs', '3_5hrs', '6_10hrs'] as TimePerWeek[]).map(val => {
            const labels: Record<string, string> = {
              '1_2hrs': '1–2 hours', '3_5hrs': '3–5 hours', '6_10hrs': '6–10 hours',
            }
            return (
              <button key={val} type="button" onClick={() => onChange({ time_per_week: val })}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  data.time_per_week === val
                    ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-brand-accent'
                }`}>
                {labels[val]}
              </button>
            )
          })}
        </div>
        {/* Live task-count estimate — appears as soon as a tier is selected */}
        {data.time_per_week && (
          <p className="text-xs text-brand-button mt-2.5">
            At this pace your free 30-day plan will include{' '}
            <span className="font-medium">{TASK_ESTIMATES[data.time_per_week]}</span>
            , paced to your schedule.
          </p>
        )}
      </div>

      <OptionRow<MonthlyBudget>
        label="Monthly marketing budget"
        options={[
          { value: '0_50', label: '$0–50' },
          { value: '50_200', label: '$50–200' },
          { value: '200_plus', label: '$200+' },
        ]}
        value={data.monthly_budget}
        onChange={v => onChange({ monthly_budget: v })}
      />

      <OptionRow<ExperienceLevel>
        label="Marketing experience level"
        options={[
          { value: 'first_time', label: 'First-timer' },
          { value: 'mid_career', label: 'Some experience' },
          { value: 'established', label: 'Well-established' },
        ]}
        value={data.experience_level}
        onChange={v => onChange({ experience_level: v })}
      />

      <OptionRow<ExistingAudience>
        label="Existing audience (email + social combined)"
        options={[
          { value: 'under_500', label: 'Under 500' },
          { value: '500_2k', label: '500–2k' },
          { value: '2k_10k', label: '2k–10k' },
          { value: '10k_plus', label: '10k+' },
        ]}
        value={data.existing_audience}
        onChange={v => onChange({ existing_audience: v })}
      />

      <OptionRow<PublishingPath>
        label="Publishing path"
        options={[
          { value: 'self', label: 'Self-publishing' },
          { value: 'traditional', label: 'Traditional' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'undecided', label: 'Undecided' },
        ]}
        value={data.publishing_path}
        onChange={v => onChange({ publishing_path: v })}
      />

      {/* Launch timeframe — ranges instead of exact date, optional */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-0.5">
          Expected launch / publication timeframe{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </p>
        <p className="text-xs text-gray-400 mb-2">
          Helps us time your plan phases. Skip if you&apos;re not sure yet.
        </p>
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'within_12mo', label: 'Within 12 months' },
            { value: '12_18mo', label: '12–18 months' },
            { value: '1_2yr', label: '1–2 years' },
            { value: '2yr_plus', label: '2+ years' },
            { value: 'already_published', label: 'Already published' },
          ] as { value: LaunchTimeframe; label: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange({ launch_timeframe: data.launch_timeframe === opt.value ? '' : opt.value })
              }
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                data.launch_timeframe === opt.value
                  ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-brand-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBack}
          className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!canProceed}
          className="flex-1 py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          Continue
        </button>
      </div>
    </div>
  )
}
