import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import {
  getFindingById,
  updateFindingStatus,
  listWorkspaceFindings,
} from '../db/queries/findings.js'
import { BadRequestError, NotFoundError } from '../errors/http-error.js'
import { sendProblem } from './_helpers.js'
import { writeAudit } from '../utils/audit.js'

type WorkspaceQuery = { workspaceId: string }
type FindingListQuery = {
  limit?: string
  offset?: string
  runId?: string
  severity?: string
  status?: string
  category?: string
}
type FindingParams = {
  workspaceId: string
  projectId: string
  runId: string
  findingId: string
}

const patchFindingSchema = z.object({
  status: z.enum(['open', 'resolved', 'suppressed']),
})

function parsePagination(q: FindingListQuery): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(1, parseInt(q.limit ?? '50', 10) || 50), 100),
    offset: Math.max(0, parseInt(q.offset ?? '0', 10) || 0),
  }
}

export async function findingRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]

  // ── Workspace-level list (with filters) ──────────────────────────────────────
  app.get<{ Params: WorkspaceQuery; Querystring: FindingListQuery }>(
    '/:workspaceId/findings',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId } = request.params
      const { limit, offset } = parsePagination(request.query)
      const { runId, severity, status, category } = request.query

      const rows = await listWorkspaceFindings(getDb(), workspaceId, {
        runId,
        severity,
        status,
        category,
        limit,
        offset,
      })

      return reply.send({
        data: rows,
        meta: { total: rows.length, limit, offset },
      })
    },
  )

  // ── Update finding status ────────────────────────────────────────────────────
  app.patch<{ Params: FindingParams }>(
    '/:workspaceId/projects/:projectId/runs/:runId/findings/:findingId',
    { preHandler: wh },
    async (request, reply) => {
      const parse = patchFindingSchema.safeParse(request.body)
      if (!parse.success) {
        const detail = parse.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
        return sendProblem(reply, new BadRequestError(detail), request.url)
      }

      const { workspaceId, runId, findingId } = request.params
      const finding = await getFindingById(getDb(), findingId, workspaceId)
      if (!finding) return sendProblem(reply, new NotFoundError('Finding not found'), request.url)

      const updated = await updateFindingStatus(
        getDb(),
        findingId,
        workspaceId,
        parse.data.status,
      )

      void writeAudit(getDb(), {
        workspaceId,
        actorUserId: request.user.sub,
        action: 'finding.update',
        targetType: 'finding',
        targetId: findingId,
        metadata: {
          runId,
          previousStatus: finding.status,
          newStatus: parse.data.status,
        },
      }).catch(() => {})

      return reply.send({ data: updated })
    },
  )
}
