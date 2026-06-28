import { describe, it, expect, vi } from 'vitest'
import { executeCoreWorkflowStep } from '../3-execute-core-workflow.js'
import type { StepContext, GenerationContext } from '../../../types.js'
import { validateManifest } from '@mcpforge/domain'

const CTX_STATE: GenerationContext = {
  workspace: { id: 'ws-1', name: 'Test WS' },
  project: { id: 'proj-1', name: 'Test Project' },
  config: {
    connectorName: 'Stripe',
    connectorType: 'REST',
    description: 'Stripe connector',
    features: ['pagination'],
    outputLanguage: 'typescript',
    aiProvider: 'mock',
    aiModel: 'mock',
  },
  inputs: [],
}

function makeCtx(context?: GenerationContext): StepContext {
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: {
      runId: 'run-1', workspaceId: 'ws-1', projectId: 'proj-1',
      config: { connectorName: 'Stripe', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript' as const, features: [] },
      inputs: [],
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: { context },
  }
}

describe('executeCoreWorkflowStep', () => {
  it('fails with STEP_ORDER_VIOLATION when context is missing', async () => {
    const r = await executeCoreWorkflowStep(makeCtx(undefined))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
  })

  it('returns ok:true for a valid context', async () => {
    const r = await executeCoreWorkflowStep(makeCtx(CTX_STATE))
    expect(r.ok).toBe(true)
  })

  it('coreOutput contains all required fields', async () => {
    const r = await executeCoreWorkflowStep(makeCtx(CTX_STATE))
    if (!r.ok) return
    const out = r.updates?.coreOutput
    expect(out?.server).toBeTruthy()
    expect(out?.readme).toBeTruthy()
    expect(out?.tests).toBeTruthy()
    expect(out?.dockerFile).toBeTruthy()
    expect(out?.manifest).toBeTruthy()
  })

  it('generated manifest is valid', async () => {
    const r = await executeCoreWorkflowStep(makeCtx(CTX_STATE))
    if (!r.ok) return
    const result = validateManifest(r.updates?.coreOutput?.manifest ?? '')
    expect(result.valid).toBe(true)
  })

  it('works for python outputLanguage', async () => {
    const pyCtx: GenerationContext = {
      ...CTX_STATE,
      config: { ...CTX_STATE.config, outputLanguage: 'python' },
    }
    const r = await executeCoreWorkflowStep(makeCtx(pyCtx))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.updates?.coreOutput?.server).toContain('asyncio')
  })
})
