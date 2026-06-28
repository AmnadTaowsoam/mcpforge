import { eq, and, desc } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { runs } from '../schema.js'
import type { RunRow, NewRunRow } from '../schema.js'

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])

export async function listRuns(
  db: DbClient,
  workspaceId: string,
  projectId: string,
): Promise<RunRow[]> {
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.workspaceId, workspaceId), eq(runs.projectId, projectId)))
    .orderBy(desc(runs.startedAt))
}

export async function getRunById(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<RunRow | undefined> {
  const rows = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, id), eq(runs.workspaceId, workspaceId)))
    .limit(1)
  return rows[0]
}

export async function createRun(
  db: DbClient,
  data: NewRunRow,
): Promise<RunRow> {
  const rows = await db.insert(runs).values(data).returning()
  const row = rows[0]
  if (!row) throw new Error('createRun: insert returned no rows')
  return row
}

export async function setRunReady(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<RunRow | undefined> {
  const rows = await db
    .update(runs)
    .set({ status: 'ready' })
    .where(
      and(
        eq(runs.id, id),
        eq(runs.workspaceId, workspaceId),
      ),
    )
    .returning()
  return rows[0]
}

export interface StartRunResult {
  found: boolean
  alreadyRunning?: boolean
  run?: RunRow
}

export async function startRun(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<StartRunResult> {
  const existing = await getRunById(db, id, workspaceId)
  if (!existing) return { found: false }

  if (existing.status !== 'draft' && existing.status !== 'ready') {
    return { found: true, alreadyRunning: true }
  }

  const rows = await db
    .update(runs)
    .set({ status: 'running', startedAt: new Date() })
    .where(and(eq(runs.id, id), eq(runs.workspaceId, workspaceId)))
    .returning()

  return { found: true, alreadyRunning: false, run: rows[0] }
}

export interface CancelRunResult {
  found: boolean
  alreadyTerminal?: boolean
  run?: RunRow
}

export async function cancelRun(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<CancelRunResult> {
  const existing = await getRunById(db, id, workspaceId)
  if (!existing) return { found: false }

  if (TERMINAL_STATUSES.has(existing.status)) {
    return { found: true, alreadyTerminal: true }
  }

  const rows = await db
    .update(runs)
    .set({ status: 'cancelled', completedAt: new Date() })
    .where(and(eq(runs.id, id), eq(runs.workspaceId, workspaceId)))
    .returning()

  return { found: true, alreadyTerminal: false, run: rows[0] }
}
