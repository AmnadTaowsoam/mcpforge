import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError } from '../errors/http-error.js'
import '../types.js'

export function registerWorkspace(app: FastifyInstance): void {
  app.decorate(
    'requireWorkspace',
    async function requireWorkspace(
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> {
      const params = request.params as Record<string, string>
      const workspaceId = params['workspaceId']

      if (!workspaceId) return

      if (request.user.wsid !== workspaceId) {
        const err = new ForbiddenError('Workspace access denied')
        reply.code(403).type('application/problem+json').send({
          type: err.type,
          title: err.title,
          status: err.status,
          detail: err.detail,
          instance: request.url,
        })
      }
    },
  )
}
