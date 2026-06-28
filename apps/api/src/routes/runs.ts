import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { listRuns, getRunById, createRun, startRun, cancelRun } from '../db/queries/runs.js'
import { createReviewEvent, listRunReviewEvents } from '../db/queries/review-events.js'
import { listWorkspaceArtifacts } from '../db/queries/artifacts.js'
import { listWorkspaceFindings } from '../db/queries/findings.js'
import { artifacts } from '../db/schema.js'
import { findings } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { getQueue, JOB_OPTIONS } from '../queue.js'
import { BadRequestError, NotFoundError, ConflictError, UnprocessableError } from '../errors/http-error.js'
import { sendProblem } from './_helpers.js'
import { writeAudit } from '../utils/audit.js'

type RunParams = { workspaceId: string; projectId: string }
type RunIdParams = { workspaceId: string; projectId: string; runId: string }

const createRunConfigSchema = z.object({
  connectorName: z.string().min(1),
  connectorType: z.string().default('REST'),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  outputLanguage: z.enum(['typescript', 'python']).default('typescript'),
  aiProvider: z.string().default('mock'),
  aiModel: z.string().default('mock'),
})

const createRunSchema = z.object({
  triggerType: z.enum(['manual', 'scheduled', 'api', 'webhook']).default('manual'),
  config: createRunConfigSchema,
})

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'needs_revision']),
  notes: z.string().optional(),
})

export async function runRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]
  const base = '/:workspaceId/projects/:projectId/runs'

  // ── List runs ────────────────────────────────────────────────────────────────
  app.get<{ Params: RunParams }>(base, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, projectId } = request.params
    const rows = await listRuns(getDb(), workspaceId, projectId)
    return reply.send({ data: rows, meta: { total: rows.length } })
  })

  // ── Create run ───────────────────────────────────────────────────────────────
  app.post<{ Params: RunParams }>(base, { preHandler: wh }, async (request, reply) => {
    const parse = createRunSchema.safeParse(request.body)
    if (!parse.success) {
      const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return sendProblem(reply, new BadRequestError(detail), request.url)
    }

    const { workspaceId, projectId } = request.params
    const { triggerType, config } = parse.data

    const run = await createRun(getDb(), {
      workspaceId,
      projectId,
      triggerType,
      configJson: config,
      status: 'draft',
      startedBy: request.user.sub,
    })

    void writeAudit(getDb(), {
      workspaceId,
      actorUserId: request.user.sub,
      action: 'run.create',
      targetType: 'run',
      targetId: run.id,
      metadata: { triggerType },
    }).catch(() => {})

    return reply.code(201).send({ data: run })
  })

  // ── Get run ──────────────────────────────────────────────────────────────────
  app.get<{ Params: RunIdParams }>(`${base}/:runId`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)
    return reply.send({ data: run })
  })

  // ── Start run ────────────────────────────────────────────────────────────────
  app.post<{ Params: RunIdParams }>(`${base}/:runId/start`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, projectId, runId } = request.params
    const result = await startRun(getDb(), runId, workspaceId)

    if (!result.found) return sendProblem(reply, new NotFoundError('Run not found'), request.url)
    if (result.alreadyRunning) {
      return sendProblem(
        reply,
        new ConflictError('Run is not in a startable state (draft or ready)'),
        request.url,
      )
    }

    const run = result.run!
    const configJson = (run.configJson ?? {}) as Record<string, unknown>

    await getQueue().add(
      'generate',
      { runId, workspaceId, projectId, config: configJson, inputs: [] },
      JOB_OPTIONS,
    )

    void writeAudit(getDb(), {
      workspaceId,
      actorUserId: request.user.sub,
      action: 'run.start',
      targetType: 'run',
      targetId: runId,
    }).catch(() => {})

    return reply.send({ data: run })
  })

  // ── Cancel run ───────────────────────────────────────────────────────────────
  app.post<{ Params: RunIdParams }>(`${base}/:runId/cancel`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const result = await cancelRun(getDb(), runId, workspaceId)

    if (!result.found) return sendProblem(reply, new NotFoundError('Run not found'), request.url)
    if (result.alreadyTerminal) {
      return sendProblem(
        reply,
        new UnprocessableError('Run is already in a terminal state'),
        request.url,
      )
    }

    void writeAudit(getDb(), {
      workspaceId,
      actorUserId: request.user.sub,
      action: 'run.cancel',
      targetType: 'run',
      targetId: runId,
    }).catch(() => {})

    return reply.send({ data: result.run })
  })

  // ── List artifacts ───────────────────────────────────────────────────────────
  app.get<{ Params: RunIdParams }>(`${base}/:runId/artifacts`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    const rows = await getDb()
      .select()
      .from(artifacts)
      .where(and(eq(artifacts.runId, runId), eq(artifacts.workspaceId, workspaceId)))

    return reply.send({ data: rows, meta: { total: rows.length } })
  })

  // ── List findings ────────────────────────────────────────────────────────────
  app.get<{ Params: RunIdParams }>(`${base}/:runId/findings`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    const rows = await getDb()
      .select()
      .from(findings)
      .where(and(eq(findings.runId, runId), eq(findings.workspaceId, workspaceId)))

    return reply.send({ data: rows, meta: { total: rows.length } })
  })

  // ── List review events ───────────────────────────────────────────────────────
  app.get<{ Params: RunIdParams }>(`${base}/:runId/reviews`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    const rows = await listRunReviewEvents(getDb(), runId, workspaceId)
    return reply.send({ data: rows, meta: { total: rows.length } })
  })

  // ── Submit review ────────────────────────────────────────────────────────────
  app.post<{ Params: RunIdParams }>(`${base}/:runId/review`, { preHandler: wh }, async (request, reply) => {
    const parse = reviewSchema.safeParse(request.body)
    if (!parse.success) {
      const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return sendProblem(reply, new BadRequestError(detail), request.url)
    }

    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    const review = await createReviewEvent(getDb(), {
      runId,
      workspaceId,
      reviewerUserId: request.user.sub,
      decision: parse.data.decision,
      notes: parse.data.notes,
    })

    void writeAudit(getDb(), {
      workspaceId,
      actorUserId: request.user.sub,
      action: 'run.review',
      targetType: 'run',
      targetId: runId,
      metadata: { decision: parse.data.decision, reviewId: review.id },
    }).catch(() => {})

    return reply.code(201).send({ data: review })
  })

  // ── Export run bundle ────────────────────────────────────────────────────────
  app.get<{ Params: RunIdParams }>(`${base}/:runId/export`, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    const [runArtifacts, runFindings, runReviews] = await Promise.all([
      listWorkspaceArtifacts(getDb(), workspaceId, { runId, limit: 100 }),
      listWorkspaceFindings(getDb(), workspaceId, { runId, limit: 100 }),
      listRunReviewEvents(getDb(), runId, workspaceId),
    ])

    return reply.send({
      data: {
        run,
        artifacts: runArtifacts,
        findings: runFindings,
        reviews: runReviews,
        summary: {
          artifactCount: runArtifacts.length,
          findingCount: runFindings.length,
          reviewCount: runReviews.length,
          criticalFindings: runFindings.filter(
            (f) => f.severity === 'critical' || f.severity === 'high',
          ).length,
          latestDecision: runReviews[0]?.decision ?? null,
        },
      },
    })
  })
}
