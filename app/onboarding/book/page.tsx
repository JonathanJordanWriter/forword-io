'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingData, EMPTY_ONBOARDING } from '@/lib/types'
import Image from 'next/image'
import StepIndicator from '@/components/onboarding/StepIndicator'
import Step1BookStage from '@/components/onboarding/Step1BookStage'
import Step2Genre from '@/components/onboarding/Step2Genre'
import Step3CompTitles from '@/components/onboarding/Step3CompTitles'
import Step4GoalsPlatforms from '@/components/onboarding/Step4GoalsPlatforms'
import Step5Capacity from '@/components/onboarding/Step5Capacity'
import Step6Review from '@/components/onboarding/Step6Review'

const TOTAL_STEPS = 6

export default function BookOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(EMPTY_ONBOARDING)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(updates: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...updates }))
  }

  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)) }
  function back() { setStep(s => Math.max(s - 1, 1)) }

  async function handleSubmit() {
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      setError('Session expired. Please log in again.')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('books').insert({
      user_id: user.id,
      title: data.title || null,
      book_type: data.book_type || null,
      genre: data.genres[0] ?? null,
      genres: data.genres.length ? data.genres : null,
      subgenre: data.subgenre || null,
      publishing_path: data.publishing_path || null,
      book_stage: data.book_stage || null,
      launch_date: null,
      launch_timeframe: data.launch_timeframe || null,
      comp_titles: data.comp_titles.length ? data.comp_titles : null,
      primary_goal: data.goals_ranked[0] ?? null,
      goals_ranked: data.goals_ranked.length ? data.goals_ranked : null,
      ideal_reader: data.ideal_reader,
      platforms: data.platforms,
      time_per_week: data.time_per_week || null,
      monthly_budget: data.monthly_budget || null,
      experience_level: data.experience_level || null,
      existing_audience: data.existing_audience || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="forword.io" width={160} height={46} priority />
          <p className="text-gray-500 text-sm mt-2">Let&apos;s build your 90-day plan.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

          {step === 1 && <Step1BookStage data={data} onChange={update} onNext={next} />}
          {step === 2 && <Step2Genre     data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 3 && <Step3CompTitles data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 4 && <Step4GoalsPlatforms data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 5 && <Step5Capacity  data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 6 && (
            <Step6Review
              data={data}
              onSubmit={handleSubmit}
              onBack={back}
              onEditStep={setStep}
              loading={saving}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  )
}
