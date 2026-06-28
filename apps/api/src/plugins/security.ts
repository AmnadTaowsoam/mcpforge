import type { FastifyInstance } from 'fastify'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { getEnv } from '@mcpforge/config'

export async function registerSecurity(app: FastifyInstance): Promise<void> {
  const env = getEnv()

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })

  await app.register(cors, {
    origin: env.APP_BASE_URL ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      type: 'https://mcpforge.dev/errors/too-many-requests',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Rate limit exceeded. Retry after 1 minute.',
    }),
  })
}
