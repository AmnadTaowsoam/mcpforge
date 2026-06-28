import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { getWorkspaceById, updateWorkspace, getWorkspaceMembers } from '../db/queries/workspaces.js'
import { NotFoundError, BadRequestError } from '../errors/http-error.js'
import { sendProblem } from './_helpers.js'

const patchWorkspaceSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
})

export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]

  app.get<{ Params: { workspaceId: string } }>(
    '/:workspaceId',
    { preHandler: wh },
    async (request, reply) => {
      const ws = await getWorkspaceById(getDb(), request.params.workspaceId)
      if (!ws) return sendProblem(reply, new NotFoundError('Workspace not found'), request.url)
      return reply.send({ data: ws })
    },
  )

  app.patch<{ Params: { workspaceId: string } }>(
    '/:workspaceId',
    { preHandler: wh },
    async (request, reply) => {
      const parse = patchWorkspaceSchema.safeParse(request.body)
      if (!parse.success) {
        const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        return sendProblem(reply, new BadRequestError(detail), request.url)
      }

      const updated = await updateWorkspace(getDb(), request.params.workspaceId, parse.data)
      if (!updated) return sendProblem(reply, new NotFoundError('Workspace not found'), request.url)
      return reply.send({ data: updated })
    },
  )

  app.get<{ Params: { workspaceId: string } }>(
    '/:workspaceId/members',
    { preHandler: wh },
    async (request, reply) => {
      const members = await getWorkspaceMembers(getDb(), request.params.workspaceId)
      return reply.send({ data: members, meta: { total: members.length } })
    },
  )
}
