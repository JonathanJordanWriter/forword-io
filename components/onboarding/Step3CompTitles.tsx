import { useState } from 'react'
import { OnboardingData, CompTitle } from '@/lib/types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const EMPTY_COMP: CompTitle = { title: '', author: '' }

export default function Step3CompTitles({ data, onChange, onBack, onNext }: Props) {
  const [drafts, setDrafts] = useState<CompTitle[]>(
    data.comp_titles.length > 0 ? data.comp_titles : [{ ...EMPTY_COMP }]
  )

  function updateDraft(index: number, field: keyof CompTitle, value: string) {
    const updated = drafts.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    setDrafts(updated)
    onChange({ comp_titles: updated.filter(d => d.title.trim()) })
  }

  function addComp() {
    if (drafts.length < 3) setDrafts([...drafts, { ...EMPTY_COMP }])
  }

  function removeComp(index: number) {
    const updated = drafts.filter((_, i) => i !== index)
    const next = updated.length ? updated : [{ ...EMPTY_COMP }]
    setDrafts(next)
    onChange({ comp_titles: next.filter(d => d.title.trim()) })
  }

  const hasAtLeastOne = drafts.some(d => d.title.trim() && d.author.trim())

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">Comp titles</h2>
      <p className="text-gray-500 text-sm mb-1">
        Add up to 3 books yours is similar to. Choose recent titles (last 5 years) at a similar scale to your own.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        Avoid mega-bestsellers like Harry Potter or The Hunger Games — they don&apos;t help agents or readers find your audience.
      </p>

      <div className="space-y-4">
        {drafts.map((comp, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Comp {i + 1}</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComp(i)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="text"
              value={comp.title}
              onChange={e => updateDraft(i, 'title', e.target.value)}
              placeholder="Book title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-button"
            />
            <input
              type="text"
              value={comp.author}
              onChange={e => updateDraft(i, 'author', e.target.value)}
              placeholder="Author name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-button"
            />
          </div>
        ))}
      </div>

      {drafts.length < 3 && (
        <button
          type="button"
          onClick={addComp}
          className="mt-3 text-sm text-brand-button hover:opacity-80 font-medium"
        >
          + Add another comp title
        </button>
      )}

      {/* Prominent skip note */}
      <div className="mt-5 p-3 bg-brand-accent/20 border border-brand-accent/40 rounded-lg">
        <p className="text-sm text-brand-coal font-medium">
          Not sure what to use?
        </p>
        <p className="text-sm text-gray-600 mt-0.5">
          Skip for now — you can always update your comp titles later from your dashboard.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBack}
          className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
          {hasAtLeastOne ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
