import React from 'react'

export interface Step {
  key: string
  label: string
  description?: string
}

type StepStatus = 'complete' | 'current' | 'upcoming'

interface Props {
  steps: Step[]
  currentKey: string
  className?: string
}

function getStatus(step: Step, currentKey: string, allSteps: Step[]): StepStatus {
  const currentIdx = allSteps.findIndex((s) => s.key === currentKey)
  const stepIdx = allSteps.findIndex((s) => s.key === step.key)
  if (stepIdx < currentIdx) return 'complete'
  if (stepIdx === currentIdx) return 'current'
  return 'upcoming'
}

export function Stepper({ steps, currentKey, className = '' }: Props) {
  return (
    <nav aria-label="Progress" className={`flex items-center gap-0 ${className}`}>
      {steps.map((step, i) => {
        const status = getStatus(step, currentKey, steps)
        const isLast = i === steps.length - 1
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                aria-current={status === 'current' ? 'step' : undefined}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0
                  ${status === 'complete' ? 'bg-primary text-white' : ''}
                  ${status === 'current' ? 'border-2 border-primary text-primary bg-white' : ''}
                  ${status === 'upcoming' ? 'border-2 border-neutral-300 text-neutral-400 bg-white' : ''}
                `}
              >
                {status === 'complete' ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium text-center leading-tight max-w-20 truncate
                  ${status === 'current' ? 'text-primary' : 'text-neutral-500'}
                `}
                title={step.label}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-10px]
                  ${status === 'complete' ? 'bg-primary' : 'bg-neutral-200'}
                `}
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
