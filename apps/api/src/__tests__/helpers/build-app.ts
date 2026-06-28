import Fastify, { type FastifyInstance, type FastifyError } from 'fastify'
import { registerAuth } from '../../plugins/auth.js'
import { registerWorkspace } from '../../plugins/workspace.js'
import { HttpError } from '../../errors/http-error.js'
import { healthRoutes } from '../../routes/health.js'
import { authRoutes } from '../../routes/auth.js'
import { runRoutes } from '../../routes/runs.js'
import { findingRoutes } from '../../routes/findings.js'
import { artifactRoutes } from '../../routes/artifacts.js'

// Call BEFORE buildApp() to satisfy @mcpforge/config env validation
export function setTestEnv(overrides: Record<string, string> = {}): void {
  process.env['NODE_ENV'] = 'test'
  process.env['DATABASE_URL'] = 'postgres://test:test@localhost:5432/test_db'
  process.env['REDIS_URL'] = 'redis://localhost:6379'
  process.env['JWT_SECRET'] = 'test-secret-minimum-32-characters-long'
  process.env['ENCRYPTION_KEY'] = 'test-encrypt-minimum-32-chars-lo'
  process.env['AI_PROVIDER'] = 'mock'
  process.env['AI_MODEL'] = 'mock'
  process.env['LOG_LEVEL'] = 'silent'
  Object.assign(process.env, overrides)
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  await registerAuth(app)
  registerWorkspace(app)

  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.status).type('application/problem+json').send({
        type: error.type, title: error.title, status: error.status,
        detail: error.detail, instance: request.url,
      })
    }
    const status = error.statusCode ?? 500
    return reply.code(status).type('application/problem+json').send({
      type: 'https://mcpforge.dev/errors/client-error',
      title: error.message, status, instance: request.url,
    })
  })

  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(runRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(findingRoutes, { prefix: '/api/v1/workspaces' })
  await app.register(artifactRoutes, { prefix: '/api/v1/workspaces' })

  await app.ready()
  return app
}
