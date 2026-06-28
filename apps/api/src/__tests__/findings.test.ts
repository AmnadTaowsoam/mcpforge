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
vi.mock('../db/queries/users.js', () => ({
  getUserByEmailInWorkspace: vi.fn().mockRejectedValue(new Error('no db')),
  touchLastSeen: vi.fn(),
}))
vi.mock('../db/queries/runs.js', () => ({
  listRuns: vi.fn().mockResolvedValue([]),
  getRunById: vi.fn().mockResolvedValue(null),
  createRun: vi.fn(),
  startRun: vi.fn(),
  cancelRun: vi.fn(),
}))
vi.mock('../db/queries/review-events.js', () => ({
  createReviewEvent: vi.fn(),
  listRunReviewEvents: vi.fn().mockResolvedValue([]),
}))
vi.mock('../db/queries/artifacts.js', () => ({
  listWorkspaceArtifacts: vi.fn().mockResolvedValue([{
    id: 'art-1', workspaceId: 'ws-test', runId: 'run-1',
    artifactType: 'server', path: 'stripe/src/index.ts', checksum: 'abc123',
    storageBucket: 'test-bucket', contentRef: 'stripe/src/index.ts',
    sizeBytes: 512, createdAt: '2026-01-01T00:00:00Z',
  }]),
  getArtifactById: vi.fn().mockResolvedValue({
    id: 'art-1', workspaceId: 'ws-test', runId: 'run-1',
    artifactType: 'server', path: 'stripe/src/index.ts', checksum: 'abc123',
    storageBucket: 'test-bucket', contentRef: 'stripe/src/index.ts',
    sizeBytes: 512, createdAt: '2026-01-01T00:00:00Z',
  }),
}))
vi.mock('../db/queries/findings.js', () => ({
  listWorkspaceFindings: vi.fn().mockResolvedValue([{
    id: 'find-1', workspaceId: 'ws-test', runId: 'run-1',
    severity: 'high', category: 'security', title: 'Hardcoded secret',
    body: 'API key found', status: 'open', createdAt: '2026-01-01T00:00:00Z',
  }]),
  getFindingById: vi.fn().mockResolvedValue({
    id: 'find-1', workspaceId: 'ws-test', runId: 'run-1',
    severity: 'high', category: 'security', title: 'Hardcoded secret',
    body: 'API key found', status: 'open', createdAt: '2026-01-01T00:00:00Z',
  }),
  updateFindingStatus: vi.fn().mockResolvedValue({
    id: 'find-1', workspaceId: 'ws-test', status: 'resolved',
  }),
}))
vi.mock('../utils/audit.js', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined),
}))

let app: FastifyInstance
let token: string

beforeAll(async () => {
  setTestEnv()
  app = await buildApp()
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/token',
    payload: { email: 'alice@example.com', workspaceId: 'ws-test' },
  })
  token = res.json<{ token: string }>().token
})

afterAll(async () => {
  await app?.close()
})

const FINDINGS_URL = '/api/v1/workspaces/ws-test/findings'
const FINDING_PATCH_URL =
  '/api/v1/workspaces/ws-test/projects/proj-1/runs/run-1/findings/find-1'
const ARTIFACTS_URL = '/api/v1/workspaces/ws-test/artifacts'
const ARTIFACT_URL =
  '/api/v1/workspaces/ws-test/projects/proj-1/runs/run-1/artifacts/art-1'

// ── Findings ──────────────────────────────────────────────────────────────────

describe('GET /findings — list', () => {
  it('returns 200 with findings list', async () => {
    const res = await app.inject({
      method: 'GET', url: FINDINGS_URL,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: unknown[]; meta: { total: number } }>()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta.total).toBe(1)
  })

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: FINDINGS_URL })
    expect(res.statusCode).toBe(401)
  })

  it('returns 403 when accessing a different workspace', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/v1/workspaces/ws-OTHER/findings',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('PATCH /finding — update status', () => {
  it('returns 200 with updated finding', async () => {
    const res = await app.inject({
      method: 'PATCH', url: FINDING_PATCH_URL,
      payload: { status: 'resolved' },
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: { status: string } }>()
    expect(body.data.status).toBe('resolved')
  })

  it('returns 400 for invalid status value', async () => {
    const res = await app.inject({
      method: 'PATCH', url: FINDING_PATCH_URL,
      payload: { status: 'not-a-valid-status' },
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 401 without auth', async () => {
    const res = await app.inject({
      method: 'PATCH', url: FINDING_PATCH_URL,
      payload: { status: 'resolved' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ── Artifacts ─────────────────────────────────────────────────────────────────

describe('GET /artifacts — list', () => {
  it('returns 200 with artifacts list', async () => {
    const res = await app.inject({
      method: 'GET', url: ARTIFACTS_URL,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: unknown[]; meta: { total: number } }>()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta.total).toBe(1)
  })

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: ARTIFACTS_URL })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /artifact by id', () => {
  it('returns 200 with artifact', async () => {
    const res = await app.inject({
      method: 'GET', url: ARTIFACT_URL,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ data: { id: string } }>()
    expect(body.data.id).toBe('art-1')
  })
})
