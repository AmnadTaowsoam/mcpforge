import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp, setTestEnv } from './helpers/build-app.js'

vi.mock('@mcpforge/config', () => ({
  getEnv: () => ({
    NODE_ENV: 'test', PORT: 4300, API_PORT: 4300,
    DATABASE_URL: 'postgres://test:test@localhost/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-minimum-32-characters-long',
    ENCRYPTION_KEY: 'test-encrypt-minimum-32-chars-lo',
    AI_PROVIDER: 'mock', AI_MODEL: 'mock',
    LOG_LEVEL: 'silent', APP_BASE_URL: 'http://localhost:4301',
    API_BASE_URL: 'http://localhost:4300',
    OBJECT_STORAGE_BUCKET: 'test',
    FEATURE_AI_GENERATION: true, FEATURE_EXPORT_JSON: true,
    FEATURE_EXPORT_MARKDOWN: true, FEATURE_PUBLIC_EXAMPLES: true,
    FEATURE_APPROVAL_GATES: true,
  }),
  isMockMode: () => true,
  isDev: () => false,
  isProd: () => false,
}))
vi.mock('../db/index.js', () => ({
  getDb: vi.fn(() => { throw new Error('mock: no db') }),
  getPool: vi.fn(() => ({
    connect: vi.fn().mockRejectedValue(new Error('mock: no pool')),
    end: vi.fn(),
  })),
  closeDb: vi.fn(),
  schema: {},
}))
vi.mock('../queue.js', () => ({
  getQueue: vi.fn(() => ({ add: vi.fn(), close: vi.fn() })),
  closeQueue: vi.fn(),
  JOB_OPTIONS: {},
}))

let app: FastifyInstance

beforeAll(async () => {
  setTestEnv() // still sets process.env as fallback
  app = await buildApp()
})

afterAll(async () => {
  await app.close()
})

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ status: string }>()
    expect(body.status).toBe('ok')
    expect(body).toHaveProperty('timestamp')
  })

  it('timestamp is an ISO string', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    const body = res.json<{ timestamp: string }>()
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })
})

describe('GET /ready', () => {
  it('returns 503 when DB is unreachable (mock)', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' })
    expect(res.statusCode).toBe(503)
    const body = res.json<{ status: number }>()
    expect(body.status).toBe(503)
  })
})
