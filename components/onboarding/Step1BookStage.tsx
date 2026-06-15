import { OnboardingData, BookStage } from '@/lib/types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack?: () => void
}

const STAGES: { value: BookStage; label: string; description: string }[] = [
  { value: 'idea', label: 'Just an idea', description: "I have a concept but haven't started writing yet" },
  { value: 'still_writing', label: 'Still writing', description: "I'm actively working on the manuscript" },
  { value: 'finished_manuscript', label: 'Finished manuscript', description: "I've completed the first draft" },
  { value: 'beta_reading', label: 'Beta reading', description: "My book is out with beta readers" },
  { value: 'revision', label: 'In revision', description: "I'm revising based on feedback" },
  { value: 'querying', label: 'Querying', description: "I'm actively querying literary agents or publishers" },
  { value: 'editing', label: 'Editing', description: "I'm working with an editor or in final edits" },
  { value: 'cover_design', label: 'Cover & production', description: "I'm in the final pre-launch stage" },
  { value: 'published', label: 'Already published', description: "My book is live and I want to grow readership" },
]

export default function Step1BookStage({ data, onChange, onNext, onBack }: Props) {
  const isPublished = data.book_stage === 'published'
  const canProceed = data.book_stage !== '' && (!isPublished || data.kdp_select !== null)

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">Let&apos;s start with your book</h2>
      <p className="text-gray-500 text-sm mb-6">Give it a working title and tell us where you are in the process.</p>

      {/* Book title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Book title <span className="text-gray-400 font-normal">(working title is fine)</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g. The Midnight Garden"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
        />
      </div>

      {/* Book stage */}
      <p className="text-sm font-medium text-gray-700 mb-2">Where is your book right now?</p>
      <div className="space-y-2 mb-6">
        {STAGES.map(stage => (
          <button
            key={stage.value}
            type="button"
            onClick={() => onChange({ book_stage: stage.value, kdp_select: null })}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              data.book_stage === stage.value
                ? 'border-brand-button bg-brand-accent/20'
                : 'border-gray-200 hover:border-brand-accent bg-white'
            }`}
          >
            <p className="text-sm font-medium text-gray-900">{stage.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
          </button>
        ))}
      </div>

      {/* KDP Select follow-up — only shown when "Already published" is selected */}
      {isPublished && (
        <div className="mb-6 px-4 py-4 bg-brand-accent/15 border border-brand-accent/40 rounded-xl">
          <p className="text-sm font-medium text-gray-800 mb-1">
            Is your title enrolled in KDP Select?
          </p>
          <p className="text-xs text-gray-500 mb-3">
            KDP Select is Amazon&apos;s program for self-published ebooks that enables Countdown Deals, free promotions, and Kindle Unlimited access. Your answer helps us include the right tasks in your plan.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ kdp_select: true })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                data.kdp_select === true
                  ? 'border-brand-button bg-brand-button text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-accent'
              }`}
            >
              Yes, enrolled
            </button>
            <button
              type="button"
              onClick={() => onChange({ kdp_select: false })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                data.kdp_select === false
                  ? 'border-brand-button bg-brand-button text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-accent'
              }`}
            >
              No, not enrolled
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
