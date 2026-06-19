import { OnboardingData, BookType } from '@/lib/types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const BOOK_TYPES: { value: BookType; label: string }[] = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'nonfiction', label: 'Nonfiction' },
]

const FICTION_GENRES = [
  'Literary fiction',
  'Romance',
  'Romantasy',
  'Thriller / Suspense',
  'Mystery / Cozy mystery',
  'Horror',
  'Fantasy',
  'Sci-fi',
  'Historical fiction',
  "Women's fiction",
  'Contemporary fiction',
  'Paranormal',
  'Adventure / Action',
  'Erotica / Dark romance',
  'Young Adult (YA)',
  'Middle Grade',
  'Early Readers',
  'Graphic Novel',
  'Anthology',
]

const NONFICTION_GENRES = [
  'Memoir / Personal essay',
  'Self-help / Personal growth',
  'How To',
  'Business / Leadership',
  'Health & wellness',
  'Parenting / Family',
  'Spirituality / Faith',
  'True crime',
  'History / Biography',
  'Science / Nature',
  'Politics / Current events',
  'Finance / Investing',
  'Cookbooks / Food',
  'Education / Academic',
  'Travel',
  'Humor / Essay',
  'Poetry',
  'Early Readers',
  'Anthology',
]

const GENRES_BY_TYPE: Record<string, string[]> = {
  fiction: FICTION_GENRES,
  nonfiction: NONFICTION_GENRES,
}

export default function Step2Genre({ data, onChange, onNext, onBack }: Props) {
  const presetGenres = data.book_type ? GENRES_BY_TYPE[data.book_type] ?? [] : []

  // Toggle a genre on/off in the multi-select array
  function toggleGenre(genre: string) {
    const current = data.genres
    const next = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre]
    onChange({ genres: next })
  }

  // Custom genre text field — only active when no preset is selected or user wants to add their own
  const customGenreValue = data.genres.find(g => !presetGenres.includes(g)) ?? ''

  function handleCustomGenre(value: string) {
    // Replace any previously typed custom entry with the new one
    const withoutCustom = data.genres.filter(g => presetGenres.includes(g))
    onChange({ genres: value.trim() ? [...withoutCustom, value] : withoutCustom })
  }

  const canProceed = data.book_type && data.genres.length > 0

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">What kind of book is it?</h2>
      <p className="text-gray-500 text-sm mb-6">
        Select your book type then choose one or more genres — your plan will be tailored to all of them.
      </p>

      {/* Book type chips */}
      <p className="text-sm font-medium text-gray-700 mb-2">Book type</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {BOOK_TYPES.map(bt => (
          <button
            key={bt.value}
            type="button"
            onClick={() => onChange({ book_type: bt.value, genres: [] })}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              data.book_type === bt.value
                ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                : 'border-gray-200 text-gray-600 hover:border-brand-accent'
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* Genre multi-select chips */}
      {presetGenres.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Genre{' '}
            <span className="text-gray-400 font-normal">(select all that apply)</span>
          </p>
          {data.genres.length > 0 && (
            <p className="text-xs text-brand-button mb-2">
              {data.genres.filter(g => presetGenres.includes(g)).join(', ')}
              {data.genres.filter(g => presetGenres.includes(g)).length > 0 && ' selected'}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {presetGenres.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  data.genres.includes(g)
                    ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-brand-accent'
                }`}
              >
                {data.genres.includes(g) && <span className="mr-1 text-xs">✓</span>}
                {g}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Custom genre free text */}
      {data.book_type && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Not listed? Enter your genre
          </label>
          <input
            type="text"
            value={customGenreValue}
            onChange={e => handleCustomGenre(e.target.value)}
            placeholder="e.g. Solarpunk, Cozy fantasy, Quiet literary…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button"
          />
        </div>
      )}

      {/* Multi-genre question */}
      {data.genres.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Do you write in more than one genre?
          </p>
          <p className="text-xs text-gray-400 mb-2">
            This helps us avoid suggesting things like &ldquo;add Thriller Author to your bio&rdquo; if you also write Fantasy and How-To.
          </p>
          <div className="flex gap-2">
            {([false, true] as const).map(val => (
              <button
                key={String(val)}
                type="button"
                onClick={() => onChange({ writes_multiple_genres: val })}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                  data.writes_multiple_genres === val
                    ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-brand-accent'
                }`}
              >
                {val ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subgenre / keywords */}
      {data.genres.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords / subgenre <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={data.subgenre}
            onChange={e => onChange({ subgenre: e.target.value })}
            placeholder={
              data.book_type === 'nonfiction'
                ? 'e.g. hobbies, business building, speaking, financial literacy…'
                : 'e.g. small-town, dark academia, slow burn, found family…'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button"
          />
          <p className="text-xs text-gray-400 mt-1">
            Separate multiple keywords with a comma. These help personalize your plan even further.
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
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
