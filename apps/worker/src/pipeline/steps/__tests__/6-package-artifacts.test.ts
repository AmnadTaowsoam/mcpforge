import { describe, it, expect, vi } from 'vitest'
import { packageArtifactsStep } from '../6-package-artifacts.js'
import type { StepContext, CoreWorkflowOutput, GenerationContext } from '../../../types.js'

const CORE_OUTPUT: CoreWorkflowOutput = {
  server: 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"',
  readme: '# Stripe\nGenerated connector',
  tests: 'import { describe, it } from "vitest"',
  dockerFile: 'FROM node:20-alpine\nWORKDIR /app',
  manifest: JSON.stringify({ name: 'Stripe', version: '1.0.0', mcpVersion: '1.0', tools: [] }),
}

const CTX_STATE: GenerationContext = {
  workspace: { id: 'ws-1', name: 'Test' },
  project: { id: 'proj-1', name: 'Project' },
  config: { connectorName: 'Stripe', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript', features: [] },
  inputs: [],
}

function makeCtx(coreOutput?: CoreWorkflowOutput, context?: GenerationContext): StepContext {
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: {
      runId: 'run-1', workspaceId: 'ws-1', projectId: 'proj-1',
      config: { connectorName: 'Stripe', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript' as const, features: [] },
      inputs: [],
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: { coreOutput, context },
  }
}

describe('packageArtifactsStep', () => {
  it('fails with STEP_ORDER_VIOLATION when coreOutput is missing', async () => {
    const r = await packageArtifactsStep(makeCtx(undefined, CTX_STATE))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
  })

  it('fails with STEP_ORDER_VIOLATION when context is missing', async () => {
    const r = await packageArtifactsStep(makeCtx(CORE_OUTPUT, undefined))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
  })

  it('returns ok:true with valid state', async () => {
    const r = await packageArtifactsStep(makeCtx(CORE_OUTPUT, CTX_STATE))
    expect(r.ok).toBe(true)
  })

  it('produces 5 artifacts (server, readme, tests, dockerfile, manifest)', async () => {
    const r = await packageArtifactsStep(makeCtx(CORE_OUTPUT, CTX_STATE))
    if (!r.ok) return
    expect(r.updates?.artifacts).toHaveLength(5)
  })

  it('each artifact has a 64-char sha256 checksum', async () => {
    const r = await packageArtifactsStep(makeCtx(CORE_OUTPUT, CTX_STATE))
    if (!r.ok) return
    for (const a of r.updates?.artifacts ?? []) {
      expect(a.checksum).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('artifact paths include slugified connectorName', async () => {
    const r = await packageArtifactsStep(makeCtx(CORE_OUTPUT, CTX_STATE))
    if (!r.ok) return
    const paths = (r.updates?.artifacts ?? []).map((a) => a.path)
    expect(paths.every((p) => p.startsWith('stripe/'))).toBe(true)
  })

  it('artifact types cover server, readme, tests, dockerfile, manifest', async () => {
    const r = await packageArtifactsStep(makeCtx(CORE_OUTPUT, CTX_STATE))
    if (!r.ok) return
    const types = (r.updates?.artifacts ?? []).map((a) => a.artifactType).sort()
    expect(types).toEqual(['dockerfile', 'manifest', 'readme', 'server', 'tests'])
  })
})
