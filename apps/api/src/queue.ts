import { Queue } from 'bullmq'
import { getEnv } from '@mcpforge/config'

const QUEUE_NAME = 'mcp-generation'

export interface GenerationJobPayload {
  runId: string
  workspaceId: string
  projectId: string
  config: Record<string, unknown>
  inputs: Array<{ key: string; label: string; value: string; inputType: string }>
}

export const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
} as const

let _queue: Queue<GenerationJobPayload> | undefined

export function getQueue(): Queue<GenerationJobPayload> {
  if (!_queue) {
    const env = getEnv()
    _queue = new Queue<GenerationJobPayload>(QUEUE_NAME, {
      connection: { url: env.REDIS_URL },
    })
  }
  return _queue
}

export async function closeQueue(): Promise<void> {
  if (_queue) {
    await _queue.close()
    _queue = undefined
  }
}
