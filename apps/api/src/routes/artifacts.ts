import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/index.js'
import { getArtifactById, listWorkspaceArtifacts } from '../db/queries/artifacts.js'
import { NotFoundError } from '../errors/http-error.js'
import { sendProblem } from './_helpers.js'

type WorkspaceQuery = { workspaceId: string }
type ArtifactQuery = {
  limit?: string
  offset?: string
  runId?: string
  artifactType?: string
}
type ArtifactParams = {
  workspaceId: string
  projectId: string
  runId: string
  artifactId: string
}

function parsePagination(q: ArtifactQuery): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(1, parseInt(q.limit ?? '50', 10) || 50), 100),
    offset: Math.max(0, parseInt(q.offset ?? '0', 10) || 0),
  }
}

export async function artifactRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]

  // ── Workspace-level list ─────────────────────────────────────────────────────
  app.get<{ Params: WorkspaceQuery; Querystring: ArtifactQuery }>(
    '/:workspaceId/artifacts',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId } = request.params
      const { limit, offset } = parsePagination(request.query)
      const { runId, artifactType } = request.query

      const rows = await listWorkspaceArtifacts(getDb(), workspaceId, {
        runId,
        artifactType,
        limit,
        offset,
      })

      return reply.send({
        data: rows,
        meta: { total: rows.length, limit, offset },
      })
    },
  )

  // ── Single artifact by id ────────────────────────────────────────────────────
  app.get<{ Params: ArtifactParams }>(
    '/:workspaceId/projects/:projectId/runs/:runId/artifacts/:artifactId',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId, artifactId } = request.params
      const artifact = await getArtifactById(getDb(), artifactId, workspaceId)
      if (!artifact) return sendProblem(reply, new NotFoundError('Artifact not found'), request.url)
      return reply.send({ data: artifact })
    },
  )
}
