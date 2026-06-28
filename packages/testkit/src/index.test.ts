import { describe, it, expect } from 'vitest'
import {
  makeWorkspace,
  makeUser,
  makeProject,
  makeRun,
  makeInputItem,
  makeArtifact,
  makeFinding,
  makeReviewEvent,
  makeAuditEvent,
} from './index.js'

describe('makeWorkspace', () => {
  it('returns a valid Workspace with defaults', () => {
    const ws = makeWorkspace()
    expect(ws.id).toMatch(/^test-id-/)
    expect(ws.name).toBe('test-workspace')
    expect(ws.plan).toBe('free')
    expect(ws.retentionDays).toBe(30)
    expect(ws.createdAt).toBeInstanceOf(Date)
  })

  it('applies overrides', () => {
    const ws = makeWorkspace({ name: 'prod-workspace', plan: 'enterprise' })
    expect(ws.name).toBe('prod-workspace')
    expect(ws.plan).toBe('enterprise')
  })
})

describe('makeUser', () => {
  it('returns a valid User with editor role by default', () => {
    const user = makeUser()
    expect(user.email).toBe('test@example.com')
    expect(user.role).toBe('editor')
    expect(user.lastSeenAt).toBeNull()
  })

  it('allows overriding role to owner', () => {
    const user = makeUser({ role: 'owner' })
    expect(user.role).toBe('owner')
  })
})

describe('makeProject', () => {
  it('returns a valid Project', () => {
    const proj = makeProject()
    expect(proj.domain).toBe('mcp-server-generation')
    expect(proj.status).toBe('active')
    expect(proj.metadataJson).toEqual({})
  })
})

describe('makeRun', () => {
  it('returns a draft Run by default', () => {
    const run = makeRun()
    expect(run.status).toBe('draft')
    expect(run.startedAt).toBeNull()
    expect(run.failureCode).toBeNull()
  })

  it('allows overriding status to completed', () => {
    const run = makeRun({ status: 'completed', completedAt: new Date('2026-06-28') })
    expect(run.status).toBe('completed')
    expect(run.completedAt).toBeInstanceOf(Date)
  })
})

describe('makeInputItem', () => {
  it('returns valid InputItem with validation_status=valid', () => {
    const item = makeInputItem()
    expect(item.inputType).toBe('connector_name')
    expect(item.validationStatus).toBe('valid')
    expect(item.warningsJson).toEqual([])
  })
})

describe('makeArtifact', () => {
  it('returns valid Artifact', () => {
    const art = makeArtifact()
    expect(art.artifactType).toBe('server')
    expect(art.path).toBe('server/index.ts')
    expect(art.validationStatus).toBe('valid')
  })
})

describe('makeFinding', () => {
  it('returns open Finding with info severity', () => {
    const f = makeFinding()
    expect(f.severity).toBe('info')
    expect(f.status).toBe('open')
    expect(f.category).toBe('advisory')
  })

  it('allows critical severity override', () => {
    const f = makeFinding({ severity: 'critical', category: 'security' })
    expect(f.severity).toBe('critical')
    expect(f.category).toBe('security')
  })
})

describe('makeReviewEvent', () => {
  it('returns approved ReviewEvent by default', () => {
    const ev = makeReviewEvent()
    expect(ev.decision).toBe('approved')
    expect(ev.checklistVersion).toBe('v1')
    expect(ev.notes).toBeNull()
  })
})

describe('makeAuditEvent', () => {
  it('returns run.create AuditEvent by default', () => {
    const ev = makeAuditEvent()
    expect(ev.action).toBe('run.create')
    expect(ev.targetType).toBe('run')
    expect(ev.metadataJson).toEqual({})
  })

  it('each call produces a unique id', () => {
    const a = makeAuditEvent()
    const b = makeAuditEvent()
    expect(a.id).not.toBe(b.id)
  })
})
