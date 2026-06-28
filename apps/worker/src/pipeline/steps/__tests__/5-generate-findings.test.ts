import { describe, it, expect, vi } from 'vitest'
import { generateFindingsStep } from '../5-generate-findings.js'
import type { StepContext, CoreWorkflowOutput, GenerationContext } from '../../../types.js'

const CTX_STATE: GenerationContext = {
  workspace: { id: 'ws-1', name: 'Test' },
  project: { id: 'proj-1', name: 'Test Project' },
  config: { connectorName: 'X', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript', features: [] },
  inputs: [],
}

function makeCtx(server: string, tests = '// tests'): StepContext {
  const coreOutput: CoreWorkflowOutput = {
    server,
    readme: '# readme',
    tests,
    dockerFile: 'FROM node',
    manifest: JSON.stringify({ name: 'X', version: '1.0.0', mcpVersion: '1.0', tools: [] }),
    packageJson: '{"name":"x"}',
    tsconfig: '{}',
  }
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: {
      runId: 'run-1', workspaceId: 'ws-1', projectId: 'proj-1',
      config: { connectorName: 'X', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript' as const, features: [] },
      inputs: [],
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: { coreOutput, context: CTX_STATE },
  }
}

describe('generateFindingsStep', () => {
  it('returns ok:true with valid state', async () => {
    const r = await generateFindingsStep(makeCtx('const x = 1'))
    expect(r.ok).toBe(true)
  })

  it('fails with STEP_ORDER_VIOLATION when context is missing', async () => {
    const ctx = makeCtx('code')
    ctx.state.context = undefined
    const r = await generateFindingsStep(ctx)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
  })

  it('detects hardcoded secret keyword in server code', async () => {
    const r = await generateFindingsStep(makeCtx('const secret = "abc123"'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const findings = r.updates?.findings ?? []
    expect(findings.some((f) => f.category === 'security')).toBe(true)
    expect(findings.find((f) => f.category === 'security')?.severity).toBe('high')
  })

  it('detects TODO in tests field', async () => {
    const r = await generateFindingsStep(makeCtx('const x = 1', '// TODO: implement'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const findings = r.updates?.findings ?? []
    expect(findings.some((f) => f.category === 'correctness')).toBe(true)
  })

  it('always emits advisory finding', async () => {
    const r = await generateFindingsStep(makeCtx('const clean = true'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect((r.updates?.findings ?? []).some((f) => f.category === 'advisory')).toBe(true)
  })
})
