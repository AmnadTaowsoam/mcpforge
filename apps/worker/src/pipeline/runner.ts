import type { Job } from 'bullmq'
import type { Logger } from 'pino'
import type { Env } from '@mcpforge/config'
import type { GenerationJobData, PipelineState, PipelineStep } from '../types.js'
import { WorkerError } from '../types.js'
import { validateInputsStep } from './steps/1-validate-inputs.js'
import { prepareContextStep } from './steps/2-prepare-context.js'
import { executeCoreWorkflowStep } from './steps/3-execute-core-workflow.js'
import { validateOutputStep } from './steps/4-validate-output.js'
import { generateFindingsStep } from './steps/5-generate-findings.js'
import { packageArtifactsStep } from './steps/6-package-artifacts.js'
import { notifyReviewersStep } from './steps/7-notify-reviewers.js'

const PIPELINE_STEPS: PipelineStep[] = [
  { name: 'validate-inputs',       handler: validateInputsStep,       progressEnd: 10 },
  { name: 'prepare-context',       handler: prepareContextStep,       progressEnd: 20 },
  { name: 'execute-core-workflow', handler: executeCoreWorkflowStep,  progressEnd: 60 },
  { name: 'validate-output',       handler: validateOutputStep,       progressEnd: 70 },
  { name: 'generate-findings',     handler: generateFindingsStep,     progressEnd: 80 },
  { name: 'package-artifacts',     handler: packageArtifactsStep,     progressEnd: 90 },
  { name: 'notify-reviewers',      handler: notifyReviewersStep,      progressEnd: 100 },
]

export async function runPipeline(
  job: Job<GenerationJobData>,
  log: Logger,
  env: Env,
): Promise<PipelineState> {
  const state: PipelineState = {}

  for (const step of PIPELINE_STEPS) {
    const stepLog = log.child({ step: step.name, jobId: job.id, runId: job.data.runId })
    stepLog.info('step start')

    let result
    try {
      result = await step.handler({ job, data: job.data, log: stepLog, env, state })
    } catch (cause) {
      throw new WorkerError(
        `Step "${step.name}" threw unexpectedly: ${String(cause)}`,
        'STEP_UNHANDLED_EXCEPTION',
        true,
      )
    }

    if (!result.ok) {
      stepLog.error({ code: result.code, error: result.error }, 'step failed')
      throw new WorkerError(result.error, result.code, result.retryable)
    }

    if (result.updates) {
      Object.assign(state, result.updates)
    }

    await job.updateProgress(step.progressEnd)
    stepLog.info({ progress: step.progressEnd }, 'step complete')
  }

  return state
}
