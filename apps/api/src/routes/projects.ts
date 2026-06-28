import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../db/queries/projects.js'
import { BadRequestError, NotFoundError } from '../errors/http-error.js'
import { sendProblem } from './_helpers.js'

type WorkspaceParams = { workspaceId: string }
type ProjectParams = { workspaceId: string; projectId: string }

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  domain: z.string().default('mcp-server-generation'),
  metadata: z.record(z.unknown()).default({}),
})

const patchProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(['active', 'archived']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]

  app.get<{ Params: WorkspaceParams }>(
    '/:workspaceId/projects',
    { preHandler: wh },
    async (request, reply) => {
      const rows = await listProjects(getDb(), request.params.workspaceId)
      return reply.send({ data: rows, meta: { total: rows.length } })
    },
  )

  app.post<{ Params: WorkspaceParams }>(
    '/:workspaceId/projects',
    { preHandler: wh },
    async (request, reply) => {
      const parse = createProjectSchema.safeParse(request.body)
      if (!parse.success) {
        const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        return sendProblem(reply, new BadRequestError(detail), request.url)
      }

      const { name, domain, metadata } = parse.data
      const project = await createProject(getDb(), {
        workspaceId: request.params.workspaceId,
        name,
        domain,
        metadataJson: metadata,
        ownerUserId: request.user.sub,
        status: 'active',
      })

      return reply.code(201).send({ data: project })
    },
  )

  app.get<{ Params: ProjectParams }>(
    '/:workspaceId/projects/:projectId',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId, projectId } = request.params
      const project = await getProjectById(getDb(), projectId, workspaceId)
      if (!project) return sendProblem(reply, new NotFoundError('Project not found'), request.url)
      return reply.send({ data: project })
    },
  )

  app.patch<{ Params: ProjectParams }>(
    '/:workspaceId/projects/:projectId',
    { preHandler: wh },
    async (request, reply) => {
      const parse = patchProjectSchema.safeParse(request.body)
      if (!parse.success) {
        const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
        return sendProblem(reply, new BadRequestError(detail), request.url)
      }

      const { workspaceId, projectId } = request.params
      const updated = await updateProject(getDb(), projectId, workspaceId, {
        ...(parse.data.name !== undefined && { name: parse.data.name }),
        ...(parse.data.status !== undefined && { status: parse.data.status }),
        ...(parse.data.metadata !== undefined && { metadataJson: parse.data.metadata }),
      })
      if (!updated) return sendProblem(reply, new NotFoundError('Project not found'), request.url)
      return reply.send({ data: updated })
    },
  )

  app.delete<{ Params: ProjectParams }>(
    '/:workspaceId/projects/:projectId',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId, projectId } = request.params
      const deleted = await deleteProject(getDb(), projectId, workspaceId)
      if (!deleted) return sendProblem(reply, new NotFoundError('Project not found'), request.url)
      return reply.code(204).send()
    },
  )
}
