import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'
import type { Logger } from 'pino'
import type { Env } from '@mcpforge/config'
import { WorkerError } from '../../types.js'

// Mock all 7 step modules — inline values only (vi.mock factories are hoisted before const declarations)
vi.mock('../steps/1-validate-inputs.js', () => ({
  validateInputsStep: vi.fn().mockResolvedValue({
    ok: true,
    updates: { validatedInputs: { connectorName: 'Test', connectorType: 'REST', description: '', inputs: [] } },
  }),
}))
vi.mock('../steps/2-prepare-context.js', () => ({
  prepareContextStep: vi.fn().mockResolvedValue({
    ok: true,
    updates: { context: { workspace: { id: 'ws-1', name: 'WS' }, project: { id: 'p-1', name: 'P' }, config: {}, inputs: [] } },
  }),
}))
vi.mock('../steps/3-execute-core-workflow.js', () => ({
  executeCoreWorkflowStep: vi.fn().mockResolvedValue({
    ok: true,
    updates: { coreOutput: { server: 'x', readme: 'r', tests: 't', dockerFile: 'd', manifest: '{}' } },
  }),
}))
vi.mock('../steps/4-validate-output.js', () => ({
  validateOutputStep: vi.fn().mockResolvedValue({ ok: true, updates: {} }),
}))
vi.mock('../steps/5-generate-findings.js', () => ({
  generateFindingsStep: vi.fn().mockResolvedValue({ ok: true, updates: { findings: [] } }),
}))
vi.mock('../steps/6-package-artifacts.js', () => ({
  packageArtifactsStep: vi.fn().mockResolvedValue({
    ok: true,
    updates: { artifacts: [{ artifactType: 'server', path: 'x/index.ts', content: 'x', checksum: 'abc' }] },
  }),
}))
vi.mock('../steps/7-notify-reviewers.js', () => ({
  notifyReviewersStep: vi.fn().mockResolvedValue({ ok: true }),
}))

import { runPipeline } from '../runner.js'
import { validateInputsStep } from '../steps/1-validate-inputs.js'
import { prepareContextStep } from '../steps/2-prepare-context.js'
import { executeCoreWorkflowStep } from '../steps/3-execute-core-workflow.js'
import { validateOutputStep } from '../steps/4-validate-output.js'
import { generateFindingsStep } from '../steps/5-generate-findings.js'
import { packageArtifactsStep } from '../steps/6-package-artifacts.js'
import { notifyReviewersStep } from '../steps/7-notify-reviewers.js'

function makeJob(): Job {
  return {
    id: 'job-1',
    data: {
      runId: 'run-1', workspaceId: 'ws-1', projectId: 'proj-1',
      config: { connectorName: 'Test', connectorType: 'REST', aiProvider: 'mock', aiModel: 'mock', outputLanguage: 'typescript', features: [] },
      inputs: [],
    },
    updateProgress: vi.fn().mockResolvedValue(undefined),
  } as unknown as Job
}

const LOG = {
  info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  child: vi.fn().mockReturnThis(),
} as unknown as Logger

const ENV = {} as Env

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(LOG.child).mockReturnValue(LOG)
})

describe('runPipeline — happy path', () => {
  it('completes and returns final PipelineState', async () => {
    const state = await runPipeline(makeJob(), LOG, ENV)
    expect(state.validatedInputs?.connectorName).toBe('Test')
    expect(state.findings).toEqual([])
    expect(state.artifacts).toHaveLength(1)
  })

  it('calls all 7 steps in sequence', async () => {
    await runPipeline(makeJob(), LOG, ENV)
    expect(validateInputsStep).toHaveBeenCalledOnce()
    expect(prepareContextStep).toHaveBeenCalledOnce()
    expect(executeCoreWorkflowStep).toHaveBeenCalledOnce()
    expect(validateOutputStep).toHaveBeenCalledOnce()
    expect(generateFindingsStep).toHaveBeenCalledOnce()
    expect(packageArtifactsStep).toHaveBeenCalledOnce()
    expect(notifyReviewersStep).toHaveBeenCalledOnce()
  })

  it('calls job.updateProgress 7 times (once per step)', async () => {
    const job = makeJob()
    await runPipeline(job, LOG, ENV)
    expect(job.updateProgress).toHaveBeenCalledTimes(7)
  })

  it('final progress call is 100', async () => {
    const job = makeJob()
    await runPipeline(job, LOG, ENV)
    const calls = vi.mocked(job.updateProgress).mock.calls
    expect(calls[calls.length - 1]?.[0]).toBe(100)
  })
})

describe('runPipeline — step failure', () => {
  it('throws WorkerError when a step returns ok:false', async () => {
    vi.mocked(validateInputsStep).mockResolvedValueOnce({
      ok: false,
      error: 'runId is required',
      code: 'INVALID_RUN_ID',
      retryable: false,
    })
    await expect(runPipeline(makeJob(), LOG, ENV)).rejects.toThrow(WorkerError)
  })

  it('WorkerError message contains the step error message', async () => {
    vi.mocked(prepareContextStep).mockResolvedValueOnce({
      ok: false,
      error: 'validate-inputs step must run first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    })
    await expect(runPipeline(makeJob(), LOG, ENV)).rejects.toThrow('validate-inputs step must run first')
  })

  it('throws WorkerError with STEP_UNHANDLED_EXCEPTION when a step throws', async () => {
    vi.mocked(executeCoreWorkflowStep).mockRejectedValueOnce(new Error('segfault'))
    try {
      await runPipeline(makeJob(), LOG, ENV)
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(WorkerError)
      expect((err as WorkerError).code).toBe('STEP_UNHANDLED_EXCEPTION')
    }
  })
})
