import { describe, it, expect, vi } from 'vitest'
import { prepareContextStep } from '../2-prepare-context.js'
import type { StepContext, ValidatedInputs } from '../../../types.js'

function makeCtx(validatedInputs?: ValidatedInputs): StepContext {
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: {
      runId: 'run-1', workspaceId: 'ws-1', projectId: 'proj-1',
      config: { connectorName: 'Stripe', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript' as const, features: [] },
      inputs: [],
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: { validatedInputs },
  }
}

const VALID_INPUTS: ValidatedInputs = {
  connectorName: 'Stripe',
  connectorType: 'REST',
  description: 'Stripe connector',
  inputs: [],
}

describe('prepareContextStep', () => {
  it('returns ok:true with valid state', async () => {
    const r = await prepareContextStep(makeCtx(VALID_INPUTS))
    expect(r.ok).toBe(true)
  })

  it('fails with STEP_ORDER_VIOLATION when validatedInputs is missing', async () => {
    const r = await prepareContextStep(makeCtx(undefined))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
    expect(r.retryable).toBe(false)
  })

  it('context.workspace.id matches workspaceId from job data', async () => {
    const r = await prepareContextStep(makeCtx(VALID_INPUTS))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.updates?.context?.workspace.id).toBe('ws-1')
  })

  it('context.project.id matches projectId from job data', async () => {
    const r = await prepareContextStep(makeCtx(VALID_INPUTS))
    if (!r.ok) return
    expect(r.updates?.context?.project.id).toBe('proj-1')
  })

  it('context.config carries through from job data', async () => {
    const r = await prepareContextStep(makeCtx(VALID_INPUTS))
    if (!r.ok) return
    expect(r.updates?.context?.config.connectorName).toBe('Stripe')
  })
})
