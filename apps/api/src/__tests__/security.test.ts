/**
 * T25 — Security: workspace isolation + JWT edge cases
 */
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
  getQueue: vi.fn(() => ({ add: vi.fn() })),
  closeQueue: vi.fn(),
  JOB_OPTIONS: {},
}))
vi.mock('../db/queries/runs.js', () => ({
  listRuns: vi.fn().mockResolvedValue([]),
  getRunById: vi.fn().mockResolvedValue(undefined),
  createRun: vi.fn().mockResolvedValue({ id: 'run-1', status: 'draft' }),
  startRun: vi.fn(),
  cancelRun: vi.fn(),
}))
vi.mock('../db/queries/review-events.js', () => ({
  createReviewEvent: vi.fn(),
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
let tokenWsA: string
let tokenWsB: string

const WS_A_RUNS = '/api/v1/workspaces/ws-A/projects/proj-1/runs'
const WS_B_RUNS = '/api/v1/workspaces/ws-B/projects/proj-1/runs'

async function issueToken(wsid: string, email: string): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/token',
    payload: { email, workspaceId: wsid },
  })
  return res.json<{ token: string }>().token
}

beforeAll(async () => {
  setTestEnv()
  app = await buildApp()
  tokenWsA = await issueToken('ws-A', 'alice@example.com')
  tokenWsB = await issueToken('ws-B', 'bob@example.com')
})

afterAll(async () => {
  await app?.close()
})

// ─── JWT edge cases ───────────────────────────────────────────────────────────

describe('JWT edge cases', () => {
  it('rejects requests with no Authorization header → 401', async () => {
    const res = await app.inject({ method: 'GET', url: WS_A_RUNS })
    expect(res.statusCode).toBe(401)
  })

  it('rejects malformed token (not a valid JWT) → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: 'Bearer not.a.jwt' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('rejects token with wrong signature → 401', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ sub: 'u1', wsid: 'ws-A', role: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
    const fakeToken = `${header}.${payload}.badsignaturexxx`
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: `Bearer ${fakeToken}` },
    })
    expect(res.statusCode).toBe(401)
  })

  it('rejects empty Bearer value → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: 'Bearer ' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('rejects Basic auth scheme → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ─── Workspace isolation ──────────────────────────────────────────────────────

describe('workspace isolation', () => {
  it('allows ws-A token to access ws-A resources → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: `Bearer ${tokenWsA}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('denies ws-B token access to ws-A resources → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: `Bearer ${tokenWsB}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('denies ws-A token access to ws-B resources → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_B_RUNS,
      headers: { authorization: `Bearer ${tokenWsA}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('403 body is RFC 7807 problem+json', async () => {
    const res = await app.inject({
      method: 'GET',
      url: WS_A_RUNS,
      headers: { authorization: `Bearer ${tokenWsB}` },
    })
    const body = res.json<{ type: string; title: string; status: number; instance: string }>()
    expect(body.type).toMatch(/mcpforge\.dev\/errors/)
    expect(body.status).toBe(403)
    expect(body).toHaveProperty('instance')
  })

  it('cannot POST (create run) in another workspace → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: WS_A_RUNS,
      headers: { authorization: `Bearer ${tokenWsB}` },
      payload: {
        triggerType: 'manual',
        config: { connectorName: 'Stripe', connectorType: 'REST', features: [], aiProvider: 'mock', aiModel: 'mock' },
      },
    })
    expect(res.statusCode).toBe(403)
  })
})
