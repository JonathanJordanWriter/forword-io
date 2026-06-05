'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfileData, EMPTY_USER_PROFILE } from '@/lib/types'
import Image from 'next/image'
import StepProfile from '@/components/onboarding/StepProfile'

// This page handles the user profile step only.
// Book profile setup lives at /onboarding/book.

export default function OnboardingPage() {
  const router = useRouter()
  const [profileData, setProfileData] = useState<UserProfileData>(EMPTY_USER_PROFILE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateProfile(updates: Partial<UserProfileData>) {
    setProfileData(prev => ({ ...prev, ...updates }))
  }

  async function handleProfileComplete() {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      setError('Session expired. Please log in again.')
      setSaving(false)
      return
    }

    // Save profile fields to the users table immediately
    const profileUpdate: Record<string, unknown> = {}
    if (profileData.display_name)           profileUpdate.display_name       = profileData.display_name
    if (profileData.identities.length)      profileUpdate.identities          = profileData.identities
    if (profileData.birthdate)              profileUpdate.birthdate           = profileData.birthdate
    if (profileData.gender)                 profileUpdate.gender              = profileData.gender
    if (profileData.nationality)            profileUpdate.nationality         = profileData.nationality
    if (profileData.location)               profileUpdate.location            = profileData.location
    if (profileData.writing_experience)     profileUpdate.writing_experience  = profileData.writing_experience
    if (profileData.publishing_goals.length) profileUpdate.publishing_goals   = profileData.publishing_goals
    if (profileData.heard_from)             profileUpdate.heard_from          = profileData.heard_from
    if (profileData.profile_photo_url)      profileUpdate.profile_photo_url   = profileData.profile_photo_url

    const { error: saveError } = await supabase
      .from('users')
      .update(profileUpdate)
      .eq('id', user.id)

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    // Profile saved — send the user to their (initially empty) dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="forword.io" width={160} height={46} priority />
          <p className="text-gray-500 text-sm mt-2">Let&apos;s set up your author profile.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <StepProfile
            data={profileData}
            onChange={updateProfile}
            onNext={handleProfileComplete}
            saving={saving}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
