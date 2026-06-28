import { getEnv } from '@mcpforge/config'
import Fastify, { type FastifyError } from 'fastify'
import { HttpError } from './errors/http-error.js'
import { registerSecurity } from './plugins/security.js'
import { registerAuth } from './plugins/auth.js'
import { registerWorkspace } from './plugins/workspace.js'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { workspaceRoutes } from './routes/workspaces.js'
import { projectRoutes } from './routes/projects.js'
import { runRoutes } from './routes/runs.js'
import { inputRoutes } from './routes/inputs.js'
import { artifactRoutes } from './routes/artifacts.js'
import { findingRoutes } from './routes/findings.js'
import { auditRoutes } from './routes/audit.js'
import { closeDb } from './db/index.js'
import { closeQueue } from './queue.js'

async function main(): Promise<void> {
  const env = getEnv()

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
    },
    genReqId: () => crypto.randomUUID(),
  })

  // ── Security plugins (helmet, cors, rate-limit) ──────────────────────────────
  await registerSecurity(app)

  // ── JWT + workspace decorators ───────────────────────────────────────────────
  await registerAuth(app)
  registerWorkspace(app)

  // ── RFC 7807 error handler ───────────────────────────────────────────────────
  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.status).type('application/problem+json').send({
        type: error.type,
        title: error.title,
        status: error.status,
        detail: error.detail,
        instance: request.url,
      })
    }

    // @fastify/jwt and rate-limit surface their own status codes
    const status = error.statusCode ?? 500
    if (status < 500) {
      return reply.code(status).type('application/problem+json').send({
        type: `https://mcpforge.dev/errors/client-error`,
        title: error.message,
        status,
        instance: request.url,
      })
    }

    app.log.error({ err: error, url: request.url }, 'Unhandled error')
    return reply.code(500).type('application/problem+json').send({
      type: 'https://mcpforge.dev/errors/internal-server-error',
      title: 'Internal Server Error',
      status: 500,
      detail: env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      instance: request.url,
    })
  })

  // ── Routes ───────────────────────────────────────────────────────────────────
  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(workspaceRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(projectRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(runRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(inputRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(artifactRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(findingRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(auditRoutes, { prefix: '/api/v1/workspaces' })

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Shutdown signal received')
    await app.close()
    await closeQueue()
    await closeDb()
    process.exit(0)
  }

  process.on('SIGTERM', () => { void shutdown('SIGTERM') })
  process.on('SIGINT', () => { void shutdown('SIGINT') })

  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    await closeQueue()
    await closeDb()
    process.exit(1)
  }
}

main()
