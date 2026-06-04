'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfileData } from '@/lib/types'

// ── Option lists ──────────────────────────────────────────────────────────────

const IDENTITIES = [
  'Fiction Author', 'Nonfiction Author', 'Memoirist', 'Poet',
  'CEO', 'Entrepreneur', 'Executive', 'Freelancer',
  'Marketing Professional', 'Publisher',
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner',    label: 'Just starting out' },
  { value: '1_3yrs',     label: '1–3 years' },
  { value: '3_10yrs',    label: '3–10 years' },
  { value: '10plus_yrs', label: '10+ years' },
]

const GOAL_OPTIONS = [
  { value: 'fulltime',    label: 'Build a full-time writing career' },
  { value: 'side',        label: 'Side project / hobby' },
  { value: 'personal',    label: 'Personal fulfillment' },
]

const HEARD_FROM_OPTIONS = [
  { value: 'social',     label: 'Social media' },
  { value: 'google',     label: 'Google search' },
  { value: 'friend',     label: 'Friend or colleague' },
  { value: 'podcast',    label: 'Podcast' },
  { value: 'other',      label: 'Other' },
]

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary']

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand',
  'Ireland', 'South Africa', 'India', 'Nigeria', 'Kenya', 'Ghana',
  'Jamaica', 'Trinidad and Tobago', 'Barbados', 'Philippines', 'Singapore',
  'Malaysia', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Zimbabwe',
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Austria',
  'Azerbaijan', 'Bahrain', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia',
  'Brazil', 'Bulgaria', 'Cambodia', 'Cameroon', 'Chile', 'China',
  'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
  'Estonia', 'Ethiopia', 'Finland', 'France', 'Georgia', 'Germany',
  'Greece', 'Guatemala', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'Indonesia', 'Iran', 'Iraq', 'Israel', 'Italy', 'Japan', 'Jordan',
  'Kazakhstan', 'Kuwait', 'Latvia', 'Lebanon', 'Libya', 'Lithuania',
  'Luxembourg', 'Madagascar', 'Mexico', 'Moldova', 'Morocco',
  'Mozambique', 'Myanmar', 'Nepal', 'Netherlands', 'Nicaragua', 'Niger',
  'North Korea', 'Norway', 'Oman', 'Panama', 'Paraguay', 'Peru',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Slovakia', 'Slovenia', 'Somalia', 'South Korea',
  'Spain', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Other',
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  data: UserProfileData
  onChange: (updates: Partial<UserProfileData>) => void
  onNext: () => void
}

// ── Chip selector ─────────────────────────────────────────────────────────────

function ChipToggle({
  options, selected, onToggle, single = false,
}: {
  options: { value: string; label: string }[] | string[]
  selected: string | string[]
  onToggle: (v: string) => void
  single?: boolean
}) {
  const opts = (options as (string | { value: string; label: string })[]).map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  const isSelected = (v: string) =>
    single ? selected === v : (selected as string[]).includes(v)

  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onToggle(o.value)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
            isSelected(o.value)
              ? 'border-brand-button bg-brand-accent/30 text-brand-button font-medium'
              : 'border-gray-200 text-gray-600 hover:border-brand-accent'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StepProfile({ data, onChange, onNext }: Props) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Photo upload ─────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be under 5 MB.')
      return
    }

    setUploadingPhoto(true)
    setPhotoError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (error) {
        setPhotoError('Upload failed — make sure the "avatars" storage bucket exists.')
        return
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      onChange({ profile_photo_url: urlData.publicUrl })
    } finally {
      setUploadingPhoto(false)
    }
  }

  // ── Chip toggles ─────────────────────────────────────────────────────────
  function toggleIdentity(v: string) {
    const next = data.identities.includes(v)
      ? data.identities.filter(i => i !== v)
      : [...data.identities, v]
    onChange({ identities: next })
  }

  function toggleGoal(v: string) {
    const next = data.publishing_goals.includes(v)
      ? data.publishing_goals.filter(g => g !== v)
      : [...data.publishing_goals, v]
    onChange({ publishing_goals: next })
  }

  // ── Validation + continue ─────────────────────────────────────────────────
  function handleNext() {
    if (!data.display_name.trim()) {
      setValidationError('Please enter a display name or pen name.')
      return
    }
    if (data.identities.length === 0) {
      setValidationError('Please select at least one identity.')
      return
    }
    setValidationError(null)
    onNext()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-brand-coal mb-1">Your author profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Tell us a bit about yourself. Your display name appears on the leaderboard.
      </p>

      <div className="space-y-6">

        {/* Profile photo */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Profile photo <span className="text-gray-400 font-normal">(optional)</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 hover:border-brand-button transition-colors flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              {data.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-300">+</span>
              )}
            </button>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-sm text-brand-button font-medium hover:opacity-75 transition-opacity disabled:opacity-40"
              >
                {uploadingPhoto ? 'Uploading…' : data.profile_photo_url ? 'Change photo' : 'Upload photo'}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP · max 5 MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
        </div>

        {/* Display name — required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display name / pen name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.display_name}
            onChange={e => onChange({ display_name: e.target.value })}
            placeholder="e.g. J.K. Smithson, Alex Rivera…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button"
          />
          <p className="text-xs text-gray-400 mt-1">This is how you&apos;ll appear on the leaderboard and in the community.</p>
        </div>

        {/* Identity chips — required */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            How would you describe yourself? <span className="text-red-400">*</span>
          </p>
          <p className="text-xs text-gray-400 mb-2">Select all that apply.</p>
          <ChipToggle options={IDENTITIES} selected={data.identities} onToggle={toggleIdentity} />
        </div>

        {/* About You */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">About You (optional)</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Birthdate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input
                type="date"
                value={data.birthdate}
                onChange={e => onChange({ birthdate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-button"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={data.location}
                onChange={e => onChange({ location: e.target.value })}
                placeholder="City, State or Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Gender</p>
            <ChipToggle
              options={GENDER_OPTIONS}
              selected={data.gender}
              onToggle={v => onChange({ gender: data.gender === v ? '' : v })}
              single
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <select
              value={data.nationality}
              onChange={e => onChange({ nationality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-button bg-white"
            >
              <option value="">Select a country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Writing Journey */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Your Writing Journey (optional)</p>

          {/* Experience */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">How long have you been writing?</p>
            <ChipToggle
              options={EXPERIENCE_OPTIONS}
              selected={data.writing_experience}
              onToggle={v => onChange({ writing_experience: data.writing_experience === v ? '' : v })}
              single
            />
          </div>

          {/* Publishing goals */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">What are your publishing goals?</p>
            <ChipToggle options={GOAL_OPTIONS} selected={data.publishing_goals} onToggle={toggleGoal} />
          </div>
        </div>

        {/* How did you hear */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2 pt-2">How did you hear about forword.io? (optional)</p>
          <ChipToggle
            options={HEARD_FROM_OPTIONS}
            selected={data.heard_from}
            onToggle={v => onChange({ heard_from: data.heard_from === v ? '' : v })}
            single
          />
        </div>

      </div>

      {validationError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">{validationError}</p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-2.5 px-4 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
