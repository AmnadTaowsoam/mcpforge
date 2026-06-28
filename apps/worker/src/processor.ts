import type { Job } from 'bullmq'
import type { Logger } from 'pino'
import { getEnv } from '@mcpforge/config'
import type { GenerationJobData } from './types.js'
import { WorkerError } from './types.js'
import { runPipeline } from './pipeline/runner.js'

export async function processGenerationJob(
  job: Job<GenerationJobData>,
  log: Logger,
): Promise<void> {
  const env = getEnv()
  const jobLog = log.child({ jobId: job.id, runId: job.data.runId, attempt: job.attemptsMade + 1 })

  jobLog.info(
    { workspaceId: job.data.workspaceId, connectorName: job.data.config.connectorName },
    'processing generation job',
  )

  try {
    const finalState = await runPipeline(job, jobLog, env)

    jobLog.info(
      {
        artifactCount: finalState.artifacts?.length ?? 0,
        findingCount: finalState.findings?.length ?? 0,
      },
      'generation job complete',
    )
  } catch (err) {
    if (err instanceof WorkerError) {
      jobLog.error({ code: err.code, retryable: err.retryable }, err.message)
      if (!err.retryable) {
        // Mark as permanently failed — BullMQ will not retry
        throw Object.assign(err, { failedReason: err.message })
      }
      throw err
    }
    // Unknown error — let BullMQ retry
    jobLog.error({ err }, 'unexpected error in processor')
    throw err
  }
}
