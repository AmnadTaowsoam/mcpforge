import type { FastifyInstance } from 'fastify'
import { getPool } from '../db/index.js'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  app.get('/ready', async (_request, reply) => {
    try {
      const client = await getPool().connect()
      await client.query('SELECT 1')
      client.release()
      return reply.send({ status: 'ready', db: 'ok' })
    } catch {
      return reply.code(503).send({
        type: 'https://mcpforge.dev/errors/service-unavailable',
        title: 'Service Unavailable',
        status: 503,
        detail: 'Database not reachable',
      })
    }
  })
}
