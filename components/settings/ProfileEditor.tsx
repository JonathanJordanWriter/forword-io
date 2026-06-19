'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfileData, EMPTY_USER_PROFILE, AUTHOR_TOOLS } from '@/lib/types'

// ── Option lists (mirrors StepProfile) ───────────────────────────────────────

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
  { value: 'fulltime',         label: 'Build a full-time writing career' },
  { value: 'side',             label: 'Side project / hobby' },
  { value: 'personal',         label: 'Personal fulfillment' },
  { value: 'business_booster', label: 'Business Booster' },
  { value: 'legacy',           label: 'Legacy' },
]

const HEARD_FROM_OPTIONS = [
  { value: 'social',   label: 'Social media' },
  { value: 'google',   label: 'Google search' },
  { value: 'friend',   label: 'Friend or colleague' },
  { value: 'podcast',  label: 'Podcast' },
  { value: 'other',    label: 'Other' },
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

export default function ProfileEditor() {
  const [profile, setProfile]       = useState<UserProfileData>(EMPTY_USER_PROFILE)
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Load existing profile on mount ───────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('display_name, identities, birthdate, gender, nationality, location, writing_experience, publishing_goals, heard_from, profile_photo_url, existing_tools')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          display_name:       data.display_name       ?? '',
          identities:         (data.identities as string[]) ?? [],
          birthdate:          data.birthdate           ?? '',
          gender:             data.gender              ?? '',
          nationality:        data.nationality         ?? '',
          location:           data.location            ?? '',
          writing_experience: data.writing_experience  ?? '',
          publishing_goals:   (data.publishing_goals as string[]) ?? [],
          heard_from:         data.heard_from          ?? '',
          profile_photo_url:  data.profile_photo_url   ?? '',
          existing_tools:     (data.existing_tools as string[]) ?? [],
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function update(updates: Partial<UserProfileData>) {
    setProfile(prev => ({ ...prev, ...updates }))
    setSaveMessage(null)
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
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
        setPhotoError('Upload failed — make sure the avatars storage bucket exists.')
        return
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      update({ profile_photo_url: urlData.publicUrl })
    } finally {
      setUploadingPhoto(false)
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setValidationError(null)
    setSaveMessage(null)

    if (!profile.display_name.trim()) {
      setValidationError('Display name is required.')
      return
    }
    if (profile.identities.length === 0) {
      setValidationError('Please select at least one identity.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('users').update({
        display_name:       profile.display_name.trim(),
        identities:         profile.identities,
        birthdate:          profile.birthdate       || null,
        gender:             profile.gender          || null,
        nationality:        profile.nationality     || null,
        location:           profile.location        || null,
        writing_experience: profile.writing_experience || null,
        publishing_goals:   profile.publishing_goals.length ? profile.publishing_goals : null,
        heard_from:         profile.heard_from      || null,
        profile_photo_url:  profile.profile_photo_url || null,
        existing_tools:     profile.existing_tools.length ? profile.existing_tools : null,
      }).eq('id', user.id)

      if (error) throw error
      setSaveMessage({ type: 'success', text: 'Profile updated successfully.' })
      // Collapse back to summary after a short delay so user sees the success message
      setTimeout(() => setExpanded(false), 1200)
    } catch {
      setSaveMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-16 flex items-center">
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    )
  }

  // Collapsed summary — photo + name + Edit button
  if (!expanded) {
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
            {profile.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-brand-coal">
              {profile.display_name || <span className="text-gray-400 font-normal">No display name set</span>}
            </p>
            {profile.identities.length > 0 && (
              <p className="text-xs text-gray-400">{profile.identities.slice(0, 3).join(' · ')}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-brand-button font-medium hover:opacity-75 transition-opacity"
        >
          Edit profile
        </button>
      </div>
    )
  }

  // Expanded form
  return (
    <div className="space-y-6">

      {/* Collapse header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Edit author profile</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          Hide
        </button>
      </div>

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
            {profile.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
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
              {uploadingPhoto ? 'Uploading…' : profile.profile_photo_url ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP · max 5 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
      </div>

      {/* Display name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display name / pen name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={profile.display_name}
          onChange={e => update({ display_name: e.target.value })}
          placeholder="e.g. J.K. Smithson, Alex Rivera…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">How you appear on the leaderboard.</p>
      </div>

      {/* Identity chips */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          How would you describe yourself? <span className="text-red-400">*</span>
        </p>
        <p className="text-xs text-gray-400 mb-2">Select all that apply.</p>
        <ChipToggle
          options={IDENTITIES}
          selected={profile.identities}
          onToggle={v => {
            const next = profile.identities.includes(v)
              ? profile.identities.filter(i => i !== v)
              : [...profile.identities, v]
            update({ identities: next })
          }}
        />
      </div>

      {/* About You */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">About You (optional)</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
            <input
              type="date"
              value={profile.birthdate}
              onChange={e => update({ birthdate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={profile.location}
              onChange={e => update({ location: e.target.value })}
              placeholder="City, State or Country"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Gender</p>
          <ChipToggle
            options={GENDER_OPTIONS}
            selected={profile.gender}
            onToggle={v => update({ gender: profile.gender === v ? '' : v })}
            single
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <select
            value={profile.nationality}
            onChange={e => update({ nationality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-button focus:border-transparent bg-white"
          >
            <option value="">Select a country…</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Writing Journey */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Your Writing Journey (optional)</p>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">How long have you been writing?</p>
          <ChipToggle
            options={EXPERIENCE_OPTIONS}
            selected={profile.writing_experience}
            onToggle={v => update({ writing_experience: profile.writing_experience === v ? '' : v })}
            single
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">What are your publishing goals?</p>
          <ChipToggle
            options={GOAL_OPTIONS}
            selected={profile.publishing_goals}
            onToggle={v => {
              const next = profile.publishing_goals.includes(v)
                ? profile.publishing_goals.filter(g => g !== v)
                : [...profile.publishing_goals, v]
              update({ publishing_goals: next })
            }}
          />
        </div>
      </div>

      {/* How did you hear */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-2 pt-2">How did you hear about forword.io? (optional)</p>
        <ChipToggle
          options={HEARD_FROM_OPTIONS}
          selected={profile.heard_from}
          onToggle={v => update({ heard_from: profile.heard_from === v ? '' : v })}
          single
        />
      </div>

      {/* Tools already in use */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="pt-2">
          <p className="text-sm font-medium text-gray-700 mb-0.5">
            Tools you already use <span className="text-gray-400 font-normal">(optional)</span>
          </p>
          <p className="text-xs text-gray-400 mb-3">
            We&apos;ll skip &ldquo;sign up for X&rdquo; tasks and give you more useful suggestions instead — like setting up templates or connecting your accounts.
          </p>
          <ChipToggle
            options={AUTHOR_TOOLS}
            selected={profile.existing_tools}
            onToggle={v => {
              const next = profile.existing_tools.includes(v)
                ? profile.existing_tools.filter(t => t !== v)
                : [...profile.existing_tools, v]
              update({ existing_tools: next })
            }}
          />
        </div>
      </div>

      {/* Validation / save feedback */}
      {(validationError || saveMessage) && (
        <p className={`text-sm rounded-lg px-3 py-2 ${
          validationError || saveMessage?.type === 'error'
            ? 'text-red-600 bg-red-50'
            : 'text-green-700 bg-green-50'
        }`}>
          {validationError ?? saveMessage?.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || uploadingPhoto}
        className="px-5 py-2 bg-brand-button text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>

    </div>
  )
}
