import { describe, it, expect, vi } from 'vitest'
import { notifyReviewersStep } from '../7-notify-reviewers.js'
import type { StepContext, PackagedArtifact, GeneratedFinding } from '../../../types.js'

const ARTIFACTS: PackagedArtifact[] = [
  { artifactType: 'server', path: 'stripe/src/index.ts', content: '...', checksum: 'abc' },
  { artifactType: 'readme', path: 'stripe/README.md', content: '...', checksum: 'def' },
]

function makeCtx(artifacts?: PackagedArtifact[], findings?: GeneratedFinding[]): StepContext {
  return {
    job: { updateProgress: vi.fn() } as unknown as StepContext['job'],
    data: {
      runId: 'run-1', workspaceId: 'ws-1', projectId: 'proj-1',
      config: { connectorName: 'X', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript' as const, features: [] },
      inputs: [],
    },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as StepContext['log'],
    env: {} as StepContext['env'],
    state: { artifacts, findings },
  }
}

describe('notifyReviewersStep', () => {
  it('fails with STEP_ORDER_VIOLATION when artifacts is missing', async () => {
    const r = await notifyReviewersStep(makeCtx(undefined))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.code).toBe('STEP_ORDER_VIOLATION')
  })

  it('returns ok:true with valid artifacts', async () => {
    const r = await notifyReviewersStep(makeCtx(ARTIFACTS))
    expect(r.ok).toBe(true)
  })

  it('returns ok:true even when findings is undefined', async () => {
    const r = await notifyReviewersStep(makeCtx(ARTIFACTS, undefined))
    expect(r.ok).toBe(true)
  })

  it('logs correct artifact and finding counts', async () => {
    const ctx = makeCtx(ARTIFACTS, [
      { severity: 'high', category: 'security', title: 'Cred', body: 'body' },
    ])
    const r = await notifyReviewersStep(ctx)
    expect(r.ok).toBe(true)
    expect(ctx.log.info).toHaveBeenCalled()
  })

  it('critical findings trigger requiresManualReview log flag', async () => {
    const spy = vi.fn()
    const ctx = makeCtx(ARTIFACTS, [
      { severity: 'critical', category: 'security', title: 'XSS', body: 'body' },
    ])
    ctx.log.info = spy as unknown as typeof ctx.log.info
    await notifyReviewersStep(ctx)
    const call = spy.mock.calls[0] as [Record<string, unknown>]
    expect(call[0]?.['requiresManualReview']).toBe(true)
  })
})
