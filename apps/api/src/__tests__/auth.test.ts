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
  getDb: vi.fn(() => { throw new Error('mock: no db') }),
  getPool: vi.fn(() => ({ connect: vi.fn(), end: vi.fn() })),
  closeDb: vi.fn(),
  schema: {},
}))
vi.mock('../queue.js', () => ({
  getQueue: vi.fn(() => ({ add: vi.fn() })),
  closeQueue: vi.fn(),
  JOB_OPTIONS: {},
}))
vi.mock('../db/queries/users.js', () => ({
  getUserByEmailInWorkspace: vi.fn().mockRejectedValue(new Error('mock no db')),
  touchLastSeen: vi.fn(),
}))

let app: FastifyInstance

beforeAll(async () => {
  setTestEnv()
  app = await buildApp()
})

afterAll(async () => {
  await app?.close()
})

describe('POST /api/v1/auth/token', () => {
  it('issues a JWT in mock mode without a real DB', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: { email: 'alice@example.com', workspaceId: 'ws-test' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ token: string; workspaceId: string }>()
    expect(body.token).toBeTruthy()
    expect(body.workspaceId).toBe('ws-test')
  })

  it('JWT payload contains sub, wsid, role', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: { email: 'alice@example.com', workspaceId: 'ws-test' },
    })
    const { token } = res.json<{ token: string }>()
    const [, payload] = token.split('.')
    const decoded = JSON.parse(
      Buffer.from(payload!, 'base64url').toString('utf-8'),
    ) as { sub: string; wsid: string; role: string }
    expect(decoded.sub).toBeTruthy()
    expect(decoded.wsid).toBe('ws-test')
    expect(decoded.role).toBeTruthy()
  })

  it('returns 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: { email: 'not-an-email', workspaceId: 'ws-test' },
    })
    expect(res.statusCode).toBe(400)
    const body = res.json<{ status: number }>()
    expect(body.status).toBe(400)
  })

  it('returns 400 when workspaceId is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: { email: 'alice@example.com' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when body is empty', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/v1/auth/refresh', () => {
  async function getToken(): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/token',
      payload: { email: 'alice@example.com', workspaceId: 'ws-test' },
    })
    return res.json<{ token: string }>().token
  }

  it('returns a refreshed token with the same wsid claim', async () => {
    const token = await getToken()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ token: string; expiresIn: number }>()
    expect(body.token).toBeTruthy()
    expect(body.expiresIn).toBe(86_400)
    // Decode and verify wsid preserved
    const [, p] = body.token.split('.')
    const decoded = JSON.parse(Buffer.from(p!, 'base64url').toString()) as { wsid: string }
    expect(decoded.wsid).toBe('ws-test')
  })

  it('returns 401 when no Authorization header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
    })
    expect(res.statusCode).toBe(401)
  })
})
