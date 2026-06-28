'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api, type Run } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'
import clsx from 'clsx'

type Step = 'connector' | 'config' | 'confirm'

const CONNECTOR_TYPES = ['REST', 'GraphQL', 'gRPC'] as const
const LANGUAGES = ['typescript', 'python'] as const

interface WizardState {
  connectorName: string
  connectorType: string
  description: string
  outputLanguage: string
  features: string[]
}

const INITIAL: WizardState = {
  connectorName: '',
  connectorType: 'REST',
  description: '',
  outputLanguage: 'typescript',
  features: [],
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['connector', 'config', 'confirm']
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
              steps.indexOf(current) >= i
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-200 text-neutral-500',
            )}
          >
            {i + 1}
          </div>
          <span className={clsx('text-xs capitalize', current === step ? 'text-neutral-900 font-medium' : 'text-neutral-400')}>
            {step}
          </span>
          {i < steps.length - 1 && <div className="w-8 h-px bg-neutral-200" />}
        </div>
      ))}
    </div>
  )
}

export default function NewRunPage() {
  const [step, setStep] = useState<Step>('connector')
  const [state, setState] = useState<WizardState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token, user } = useAuthStore()
  const router = useRouter()

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (step === 'connector') return setStep('config')
    if (step === 'config') return setStep('confirm')

    setLoading(true)
    setError(null)
    try {
      const projectId = user?.wsid ?? 'default'
      const run = await api.post<Run>(
        `/workspaces/${user?.wsid}/runs`,
        {
          projectId,
          triggerType: 'manual',
          config: {
            connectorName: state.connectorName,
            connectorType: state.connectorType,
            description: state.description,
            outputLanguage: state.outputLanguage,
            features: state.features,
            aiProvider: 'mock',
            aiModel: 'mock',
          },
          inputs: [],
        },
        token ?? undefined,
      )
      router.push(`/runs/${run.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Create new run</h1>
      <StepIndicator current={step} />

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'connector' && (
            <>
              <h2 className="text-sm font-medium text-neutral-700 mb-3">Connector details</h2>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Connector name *</label>
                <input
                  type="text"
                  value={state.connectorName}
                  onChange={(e) => update({ connectorName: e.target.value })}
                  required
                  placeholder="e.g. Stripe"
                  className="w-full px-3 py-2 rounded border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  value={state.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={2}
                  placeholder="What does this connector do?"
                  className="w-full px-3 py-2 rounded border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}

          {step === 'config' && (
            <>
              <h2 className="text-sm font-medium text-neutral-700 mb-3">Configuration</h2>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Connector type</label>
                <select
                  value={state.connectorType}
                  onChange={(e) => update({ connectorType: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONNECTOR_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Output language</label>
                <div className="flex gap-3">
                  {LANGUAGES.map((lang) => (
                    <label key={lang} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="lang"
                        value={lang}
                        checked={state.outputLanguage === lang}
                        onChange={() => update({ outputLanguage: lang })}
                        className="accent-blue-600"
                      />
                      <span className="capitalize">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <h2 className="text-sm font-medium text-neutral-700 mb-3">Confirm</h2>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Name</dt>
                  <dd className="font-medium">{state.connectorName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Type</dt>
                  <dd className="font-medium">{state.connectorType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Language</dt>
                  <dd className="font-medium capitalize">{state.outputLanguage}</dd>
                </div>
                {state.description && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Description</dt>
                    <dd className="font-medium text-right max-w-xs">{state.description}</dd>
                  </div>
                )}
              </dl>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
              )}
            </>
          )}

          <div className="flex justify-between pt-2">
            {step !== 'connector' ? (
              <button
                type="button"
                onClick={() => setStep(step === 'confirm' ? 'config' : 'connector')}
                className="px-4 py-2 rounded border border-neutral-300 text-sm hover:bg-neutral-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={loading || (step === 'connector' && !state.connectorName)}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {step === 'confirm' ? (loading ? 'Creating…' : 'Create run') : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
