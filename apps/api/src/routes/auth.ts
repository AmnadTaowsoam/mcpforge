import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getEnv, isMockMode } from '@mcpforge/config'
import { BadRequestError, UnauthorizedError } from '../errors/http-error.js'
import { getDb } from '../db/index.js'
import { getUserByEmailInWorkspace, touchLastSeen } from '../db/queries/users.js'
import { sendProblem } from './_helpers.js'

const tokenBodySchema = z.object({
  email: z.string().email(),
  workspaceId: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: z.infer<typeof tokenBodySchema> }>('/token', async (request, reply) => {
    const parse = tokenBodySchema.safeParse(request.body)
    if (!parse.success) {
      const detail = parse.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return sendProblem(reply, new BadRequestError(detail), request.url)
    }

    const { email, workspaceId } = parse.data
    let userId: string
    let userRole: string

    if (isMockMode()) {
      // Try DB lookup first so FK constraints work with seed data.
      // Fall back to email-derived ID when DB is unavailable (pure unit-test mode).
      try {
        const user = await getUserByEmailInWorkspace(getDb(), workspaceId, email)
        if (user) {
          userId = user.id
          userRole = user.role
          await touchLastSeen(getDb(), user.id)
        } else {
          userId = `mock-${email.split('@')[0] ?? 'user'}`
          userRole = 'owner'
        }
      } catch {
        userId = `mock-${email.split('@')[0] ?? 'user'}`
        userRole = 'owner'
      }

      const env = getEnv()
      app.log.warn(
        { email, workspaceId, aiProvider: env.AI_PROVIDER },
        'Mock auth token issued — not for production use',
      )
    } else {
      const user = await getUserByEmailInWorkspace(getDb(), workspaceId, email)
      if (!user) {
        return sendProblem(
          reply,
          new UnauthorizedError('User not found in this workspace'),
          request.url,
        )
      }
      userId = user.id
      userRole = user.role
      await touchLastSeen(getDb(), user.id)
    }

    const token = await reply.jwtSign(
      { sub: userId, wsid: workspaceId, role: userRole },
      { expiresIn: '24h' },
    )

    return reply.code(200).send({ token, expiresIn: 86_400, userId, workspaceId })
  })

  // Refresh: verify existing (non-expired) token and re-sign.
  // Caller should refresh proactively before expiry (e.g. 5 min before).
  app.post('/refresh', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { sub, wsid, role } = request.user
    const token = await reply.jwtSign({ sub, wsid, role }, { expiresIn: '24h' })
    return reply.send({ token, expiresIn: 86_400 })
  })
}
