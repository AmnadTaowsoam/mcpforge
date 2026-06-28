const BASE = 'https://mcpforge.dev/errors'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail: string,
    public readonly type: string = `${BASE}/${title.toLowerCase().replace(/\s+/g, '-')}`,
  ) {
    super(detail)
    this.name = 'HttpError'
  }
}

export class BadRequestError extends HttpError {
  constructor(detail: string) {
    super(400, 'Bad Request', detail, `${BASE}/bad-request`)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(detail = 'Authentication required') {
    super(401, 'Unauthorized', detail, `${BASE}/unauthorized`)
  }
}

export class ForbiddenError extends HttpError {
  constructor(detail = 'Access denied') {
    super(403, 'Forbidden', detail, `${BASE}/forbidden`)
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string) {
    super(404, 'Not Found', `${resource} not found`, `${BASE}/not-found`)
  }
}

export class ConflictError extends HttpError {
  constructor(detail: string) {
    super(409, 'Conflict', detail, `${BASE}/conflict`)
  }
}

export class UnprocessableError extends HttpError {
  constructor(detail: string) {
    super(422, 'Unprocessable Entity', detail, `${BASE}/unprocessable-entity`)
  }
}
