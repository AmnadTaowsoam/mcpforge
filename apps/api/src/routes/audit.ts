import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/index.js'
import { listWorkspaceAuditEvents } from '../db/queries/audit-events.js'

type AuditParams = { workspaceId: string }
type AuditQuery = {
  limit?: string
  offset?: string
  action?: string
  targetType?: string
  targetId?: string
  actorUserId?: string
}

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]

  app.get<{ Params: AuditParams; Querystring: AuditQuery }>(
    '/:workspaceId/audit',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId } = request.params
      const q = request.query

      const limit = Math.min(Math.max(1, parseInt(q.limit ?? '50', 10) || 50), 200)
      const offset = Math.max(0, parseInt(q.offset ?? '0', 10) || 0)

      const rows = await listWorkspaceAuditEvents(getDb(), workspaceId, {
        action: q.action,
        targetType: q.targetType,
        targetId: q.targetId,
        actorUserId: q.actorUserId,
        limit,
        offset,
      })

      return reply.send({ data: rows, meta: { total: rows.length, limit, offset } })
    },
  )
}
