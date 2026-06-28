import { getEnv } from '@mcpforge/config'
import { Queue } from 'bullmq'

async function inspect() {
  const env = getEnv()
  const q = new Queue('mcp-generation', { connection: { url: env.REDIS_URL } })

  const [waiting, active, completed, failed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getCompletedCount(),
    q.getFailedCount(),
  ])

  process.stdout.write(JSON.stringify({ waiting, active, completed, failed }, null, 2) + '\n')
  await q.close()
}

inspect().catch(console.error)
