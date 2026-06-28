import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { getRunById, setRunReady } from '../db/queries/runs.js'
import {
  listInputItems,
  createInputItem,
  updateInputValidation,
  updateInputContent,
} from '../db/queries/input-items.js'
import { validateInput } from '../validators/input-validators.js'
import { BadRequestError, NotFoundError, ConflictError } from '../errors/http-error.js'
import { sendProblem } from './_helpers.js'

type RunParams = { workspaceId: string; projectId: string; runId: string }
type InputParams = RunParams & { inputId: string }

const INPUT_TYPES = [
  'connector_name',
  'openapi_spec',
  'docker_config',
  'readme',
  'env_vars',
  'custom',
] as const

const createInputSchema = z.object({
  inputType: z.enum(INPUT_TYPES),
  label: z.string().min(1).max(200),
  value: z.string(),
})

const patchInputSchema = z.object({
  value: z.string(),
})

export async function inputRoutes(app: FastifyInstance): Promise<void> {
  const wh = [app.authenticate, app.requireWorkspace]
  const base = '/:workspaceId/projects/:projectId/runs/:runId/inputs'

  // ── List inputs ──────────────────────────────────────────────────────────────
  app.get<{ Params: RunParams }>(base, { preHandler: wh }, async (request, reply) => {
    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    const items = await listInputItems(getDb(), runId, workspaceId)
    return reply.send({ data: items, meta: { total: items.length } })
  })

  // ── Create input ─────────────────────────────────────────────────────────────
  app.post<{ Params: RunParams }>(base, { preHandler: wh }, async (request, reply) => {
    const parse = createInputSchema.safeParse(request.body)
    if (!parse.success) {
      const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return sendProblem(reply, new BadRequestError(detail), request.url)
    }

    const { workspaceId, runId } = request.params
    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    if (run.status !== 'draft' && run.status !== 'needs_input') {
      return sendProblem(
        reply,
        new ConflictError('Inputs can only be added to runs in draft or needs_input status'),
        request.url,
      )
    }

    const { inputType, label, value } = parse.data
    const item = await createInputItem(getDb(), {
      runId,
      workspaceId,
      inputType,
      label,
      contentRef: value,
      validationStatus: 'pending',
      warningsJson: [],
    })

    return reply.code(201).send({ data: item })
  })

  // ── Update input value ───────────────────────────────────────────────────────
  app.patch<{ Params: InputParams }>(`${base}/:inputId`, { preHandler: wh }, async (request, reply) => {
    const parse = patchInputSchema.safeParse(request.body)
    if (!parse.success) {
      const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return sendProblem(reply, new BadRequestError(detail), request.url)
    }

    const { workspaceId, runId, inputId } = request.params

    const run = await getRunById(getDb(), runId, workspaceId)
    if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

    if (run.status !== 'draft' && run.status !== 'needs_input') {
      return sendProblem(
        reply,
        new ConflictError('Inputs can only be updated on runs in draft or needs_input status'),
        request.url,
      )
    }

    const updated = await updateInputContent(getDb(), inputId, workspaceId, parse.data.value)
    if (!updated) return sendProblem(reply, new NotFoundError('Input item not found'), request.url)

    return reply.send({ data: updated })
  })

  // ── Validate all inputs → transition run to ready ────────────────────────────
  app.post<{ Params: RunParams }>(
    '/:workspaceId/projects/:projectId/runs/:runId/validate',
    { preHandler: wh },
    async (request, reply) => {
      const { workspaceId, runId } = request.params

      const run = await getRunById(getDb(), runId, workspaceId)
      if (!run) return sendProblem(reply, new NotFoundError('Run not found'), request.url)

      if (run.status !== 'draft' && run.status !== 'needs_input') {
        return sendProblem(
          reply,
          new ConflictError('Only draft or needs_input runs can be validated'),
          request.url,
        )
      }

      const items = await listInputItems(getDb(), runId, workspaceId)
      if (items.length === 0) {
        return sendProblem(
          reply,
          new BadRequestError('Run has no input items to validate'),
          request.url,
        )
      }

      // Validate each item and update status
      const results = await Promise.all(
        items.map(async (item) => {
          const result = validateInput(item.inputType, item.contentRef)
          const updated = await updateInputValidation(
            getDb(),
            item.id,
            workspaceId,
            result.status,
            result.warnings,
          )
          return { item: updated ?? item, result }
        }),
      )

      const validCount = results.filter((r) => r.result.status === 'valid').length
      const invalidCount = results.filter((r) => r.result.status === 'invalid').length
      const allValid = invalidCount === 0

      let runStatus = run.status
      if (allValid) {
        const updated = await setRunReady(getDb(), runId, workspaceId)
        runStatus = updated?.status ?? runStatus
      }

      return reply.send({
        data: {
          runId,
          runStatus,
          summary: { total: items.length, valid: validCount, invalid: invalidCount },
          items: results.map((r) => ({
            id: r.item.id,
            inputType: r.item.inputType,
            label: r.item.label,
            validationStatus: r.result.status,
            warnings: r.result.warnings,
          })),
        },
      })
    },
  )
}
