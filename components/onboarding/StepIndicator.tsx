interface Props {
  currentStep: number
  totalSteps: number
}

const STEP_LABELS = [
  'Book stage',
  'Genre',
  'Comp titles',
  'Goals & platforms',
  'Capacity',
  'Review',
]

export default function StepIndicator({ currentStep, totalSteps }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                i + 1 < currentStep
                  ? 'bg-brand-button text-white'
                  : i + 1 === currentStep
                  ? 'bg-brand-button text-white ring-4 ring-brand-accent/50'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1 < currentStep ? '✓' : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-colors ${
                  i + 1 < currentStep ? 'bg-brand-button' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center mt-1">
        Step {currentStep} of {totalSteps} — {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  )
}
