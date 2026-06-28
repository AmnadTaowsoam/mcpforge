import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import jwtPlugin from '@fastify/jwt'
import { getEnv } from '@mcpforge/config'
import { UnauthorizedError } from '../errors/http-error.js'
import '../types.js'

export async function registerAuth(app: FastifyInstance): Promise<void> {
  const env = getEnv()

  await app.register(jwtPlugin, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '24h', algorithm: 'HS256' },
  })

  app.decorate(
    'authenticate',
    async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        await request.jwtVerify()
      } catch {
        const err = new UnauthorizedError('Valid JWT token required')
        reply.code(401).type('application/problem+json').send({
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
