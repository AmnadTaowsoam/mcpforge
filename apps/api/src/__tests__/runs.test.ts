import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp, setTestEnv } from './helpers/build-app.js'
import { TEST_CONFIG } from './helpers/mock-config.js'

vi.mock('@mcpforge/config', () => ({
  getEnv: () => TEST_CONFIG,
  isMockMode: () => true,
  isDev: () => false,
  isProd: () => false,
}))
vi.mock('../db/index.js', () => ({
  getDb: vi.fn(() => ({})),
  getPool: vi.fn(() => ({ connect: vi.fn(), end: vi.fn() })),
  closeDb: vi.fn(),
  schema: {},
}))
vi.mock('../queue.js', () => ({
  getQueue: vi.fn(() => ({ add: vi.fn().mockResolvedValue({ id: 'job-1' }) })),
  closeQueue: vi.fn(),
  JOB_OPTIONS: { attempts: 3, backoff: {}, removeOnComplete: {}, removeOnFail: {} },
}))
// Use inline objects to avoid TDZ issues with hoisted mocks
vi.mock('../db/queries/runs.js', () => ({
  listRuns: vi.fn().mockResolvedValue([{
    id: 'run-abc123', workspaceId: 'ws-test', projectId: 'proj-1',
    status: 'draft', triggerType: 'manual',
    configJson: { connectorName: 'Stripe', connectorType: 'REST' },
    startedBy: 'user-1', startedAt: null, completedAt: null,
    failureCode: null, failureMessage: null, inputHash: null,
  }]),
  getRunById: vi.fn().mockResolvedValue({
    id: 'run-abc123', workspaceId: 'ws-test', projectId: 'proj-1',
    status: 'draft', triggerType: 'manual',
    configJson: { connectorName: 'Stripe', connectorType: 'REST' },
    startedBy: 'user-1', startedAt: null, completedAt: null,
    failureCode: null, failureMessage: null, inputHash: null,
  }),
  createRun: vi.fn().mockResolvedValue({
    id: 'run-new', workspaceId: 'ws-test', projectId: 'proj-1',
    status: 'draft', triggerType: 'manual',
    configJson: { connectorName: 'Stripe', connectorType: 'REST' },
    startedBy: 'user-1', startedAt: null, completedAt: null,
    failureCode: null, failureMessage: null, inputHash: null,
  }),
  startRun: vi.fn().mockResolvedValue({ id: 'run-abc123', status: 'running' }),
  cancelRun: vi.fn().mockResolvedValue({ id: 'run-abc123', status: 'cancelled' }),
}))
vi.mock('../db/queries/review-events.js', () => ({
  createReviewEvent: vi.fn().mockResolvedValue({ id: 'rev-1', decision: 'approved' }),
  listRunReviewEvents: vi.fn().mockResolvedValue([]),
}))
vi.mock('../db/queries/artifacts.js', () => ({
  listWorkspaceArtifacts: vi.fn().mockResolvedValue([]),
}))
vi.mock('../db/queries/findings.js', () => ({
  listWorkspaceFindings: vi.fn().mockResolvedValue([]),
  updateFindingStatus: vi.fn(),
}))
vi.mock('../utils/audit.js', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../db/queries/users.js', () => ({
  getUserByEmailInWorkspace: vi.fn().mockRejectedValue(new Error('no db')),
  touchLastSeen: vi.fn(),
}))

let app: FastifyInstance
let authToken: string

beforeAll(async () => {
  setTestEnv()
  app = await buildApp()

  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/token',
    payload: { email: 'alice@example.com', workspaceId: 'ws-test' },
  })
  authToken = res.json<{ token: string }>().token
})

afterAll(async () => {
  await app?.close()
})

const RUNS_URL = '/api/v1/workspaces/ws-test/projects/proj-1/runs'

describe('GET /runs — list', () => {
  it('returns 200 with run list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: RUNS_URL,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: unknown[]; meta: { total: number } }>()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta.total).toBe(1)
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: RUNS_URL })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /runs — create', () => {
  const validBody = {
    triggerType: 'manual',
    config: {
      connectorName: 'Stripe',
      connectorType: 'REST',
      outputLanguage: 'typescript',
      features: [],
      aiProvider: 'mock',
      aiModel: 'mock',
    },
  }

  it('creates a run and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: RUNS_URL,
      payload: validBody,
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json<{ data: { status: string } }>()
    expect(body.data.status).toBe('draft')
  })

  it('returns 400 when connectorName is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: RUNS_URL,
      payload: { triggerType: 'manual', config: {} },
      headers: { authorization: `Bearer ${authToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'POST', url: RUNS_URL, payload: validBody })
    expect(res.statusCode).toBe(401)
  })
})
