import type { FastifyReply } from 'fastify'
import type { HttpError } from '../errors/http-error.js'

export function sendProblem(
  reply: FastifyReply,
  err: HttpError,
  instance: string,
): void {
  void reply.code(err.status).type('application/problem+json').send({
    type: err.type,
    title: err.title,
    status: err.status,
    detail: err.detail,
    instance,
  })
}
