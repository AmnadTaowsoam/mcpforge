import type { FastifyRequest, FastifyReply } from 'fastify'
import '@fastify/jwt'

export interface JwtPayload {
  sub: string
  wsid: string
  role: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireWorkspace: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
