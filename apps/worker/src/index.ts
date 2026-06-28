import { getEnv } from '@mcpforge/config'
import { Worker, type Job } from 'bullmq'
import { getLogger } from './logger.js'
import { processGenerationJob } from './processor.js'
import type { GenerationJobData } from './types.js'

const QUEUE_NAME = 'mcp-generation'

// Used by the API when enqueuing jobs — exported for shared config.
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
} as const

async function main(): Promise<void> {
  const env = getEnv()
  const log = getLogger()

  log.info({ redisUrl: env.REDIS_URL }, 'MCPForge worker starting')

  const worker = new Worker<GenerationJobData>(
    QUEUE_NAME,
    async (job: Job<GenerationJobData>) => {
      await processGenerationJob(job, log)
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 5,
    },
  )

  worker.on('active', (job) => {
    log.info({ jobId: job.id, runId: job.data.runId }, 'job active')
  })

  worker.on('progress', (job, progress) => {
    log.debug({ jobId: job.id, runId: job.data.runId, progress }, 'job progress')
  })

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, runId: job.data.runId }, 'job completed')
  })

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, runId: job?.data?.runId, err }, 'job failed')
  })

  worker.on('stalled', (jobId) => {
    log.warn({ jobId }, 'job stalled — will be retried')
  })

  worker.on('error', (err) => {
    log.error({ err }, 'worker error')
  })

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutdown signal received')
    await worker.close()
    process.exit(0)
  }

  process.on('SIGTERM', () => { void shutdown('SIGTERM') })
  process.on('SIGINT', () => { void shutdown('SIGINT') })

  log.info({ queue: QUEUE_NAME, concurrency: 5 }, 'worker ready')
}

main().catch((err: unknown) => {
  process.stderr.write(`Fatal worker error: ${String(err)}\n`)
  process.exit(1)
})
