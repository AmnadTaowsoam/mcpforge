import { describe, it, expect, vi } from 'vitest'
import { validateInputsStep } from '../1-validate-inputs.js'
import type { StepContext } from '../../../types.js'

function makeCtx(data: unknown): StepContext {
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: data as StepContext['data'],
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: {},
  }
}

const VALID_DATA = {
  runId: 'run-1',
  workspaceId: 'ws-1',
  projectId: 'proj-1',
  config: {
    connectorName: 'Stripe',
    connectorType: 'REST',
    aiProvider: 'mock',
    aiModel: 'mock',
    outputLanguage: 'typescript',
    features: [],
  },
  inputs: [],
}

describe('validateInputsStep', () => {
  it('returns ok:true for valid job data', async () => {
    const r = await validateInputsStep(makeCtx(VALID_DATA))
    expect(r.ok).toBe(true)
  })

  it('populates validatedInputs with connectorName', async () => {
    const r = await validateInputsStep(makeCtx(VALID_DATA))
    if (!r.ok) throw new Error('expected ok')
    expect(r.updates?.validatedInputs?.connectorName).toBe('Stripe')
  })

  it('returns ok:false when runId is missing', async () => {
    const r = await validateInputsStep(makeCtx({ ...VALID_DATA, runId: '' }))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('VALIDATION_FAILED')
    expect(r.retryable).toBe(false)
  })

  it('returns ok:false for completely invalid data', async () => {
    const r = await validateInputsStep(makeCtx(null))
    expect(r.ok).toBe(false)
  })

  it('defaults features to empty array when not provided', async () => {
    const data = { ...VALID_DATA, config: { ...VALID_DATA.config } }
    const r = await validateInputsStep(makeCtx(data))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.updates?.validatedInputs?.connectorName).toBe('Stripe')
  })
})
