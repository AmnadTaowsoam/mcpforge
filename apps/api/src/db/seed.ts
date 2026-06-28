import { nanoid } from 'nanoid'
import { getDb, schema, closeDb } from './index.js'

async function seed() {
  const db = getDb()

  const workspaceId = nanoid()
  const ownerId = nanoid()
  const editorId = nanoid()
  const projectId = nanoid()

  await db.insert(schema.workspaces).values({
    id: workspaceId,
    name: 'Demo Workspace',
    plan: 'free',
    retentionDays: 30,
  })

  await db.insert(schema.users).values([
    {
      id: ownerId,
      workspaceId,
      email: 'owner@example.com',
      displayName: 'Workspace Owner',
      role: 'owner',
    },
    {
      id: editorId,
      workspaceId,
      email: 'editor@example.com',
      displayName: 'Demo Editor',
      role: 'editor',
    },
  ])

  await db.insert(schema.projects).values({
    id: projectId,
    workspaceId,
    name: 'My First MCP Server',
    domain: 'mcp-server-generation',
    status: 'active',
    ownerUserId: ownerId,
    metadataJson: { description: 'Demo project seeded for development' },
  })

  const runId = nanoid()
  await db.insert(schema.runs).values({
    id: runId,
    projectId,
    workspaceId,
    status: 'completed',
    triggerType: 'manual',
    configJson: { aiProvider: 'mock' },
    startedBy: ownerId,
    startedAt: new Date('2026-01-01T09:00:00Z'),
    completedAt: new Date('2026-01-01T09:01:30Z'),
  })

  await db.insert(schema.artifacts).values([
    {
      runId,
      workspaceId,
      artifactType: 'server',
      path: 'server/index.ts',
      validationStatus: 'valid',
    },
    {
      runId,
      workspaceId,
      artifactType: 'readme',
      path: 'README.md',
      validationStatus: 'valid',
    },
  ])

  await db.insert(schema.findings).values({
    runId,
    workspaceId,
    severity: 'info',
    category: 'advisory',
    title: 'Add rate limiting to all endpoints',
    body: 'Consider adding rate limiting to prevent abuse.',
    status: 'open',
  })

  await db.insert(schema.auditEvents).values({
    workspaceId,
    actorUserId: ownerId,
    action: 'run.create',
    targetType: 'run',
    targetId: runId,
    metadataJson: { trigger: 'manual' },
  })

  process.stdout.write(`Seed complete\n  workspace: ${workspaceId}\n  project: ${projectId}\n  run: ${runId}\n`)
}

seed()
  .then(() => closeDb())
  .catch((err: unknown) => {
    process.stderr.write(String(err) + '\n')
    closeDb().finally(() => process.exit(1))
  })
