import { describe, it, expect, vi } from 'vitest'
import { validateOutputStep } from '../4-validate-output.js'
import type { StepContext, CoreWorkflowOutput } from '../../../types.js'

function makeCtx(coreOutput?: CoreWorkflowOutput): StepContext {
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: {
      runId: 'run-1',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      config: { connectorName: 'X', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript' as const, features: [] },
      inputs: [],
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: { coreOutput },
  }
}

const VALID_OUTPUT: CoreWorkflowOutput = {
  server: 'import { McpServer }',
  readme: '# Test',
  tests: 'import { describe }',
  dockerFile: 'FROM node:20',
  manifest: JSON.stringify({ name: 'X', version: '1.0.0', mcpVersion: '1.0', tools: [] }),
}

describe('validateOutputStep', () => {
  it('passes with valid coreOutput', async () => {
    const r = await validateOutputStep(makeCtx(VALID_OUTPUT))
    expect(r.ok).toBe(true)
  })

  it('fails when coreOutput is missing', async () => {
    const r = await validateOutputStep(makeCtx(undefined))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
  })

  it('fails when server code is empty', async () => {
    const r = await validateOutputStep(makeCtx({ ...VALID_OUTPUT, server: '' }))
    expect(r.ok).toBe(false)
  })

  it('fails when manifest is invalid JSON', async () => {
    const r = await validateOutputStep(makeCtx({ ...VALID_OUTPUT, manifest: 'bad json' }))
    expect(r.ok).toBe(false)
  })
})
