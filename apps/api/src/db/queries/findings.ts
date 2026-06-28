import { eq, and, desc, type SQL } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { findings } from '../schema.js'
import type { FindingRow } from '../schema.js'

export async function getFindingById(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<FindingRow | undefined> {
  const rows = await db
    .select()
    .from(findings)
    .where(and(eq(findings.id, id), eq(findings.workspaceId, workspaceId)))
    .limit(1)
  return rows[0]
}

export async function updateFindingStatus(
  db: DbClient,
  id: string,
  workspaceId: string,
  status: 'open' | 'resolved' | 'suppressed',
): Promise<FindingRow | undefined> {
  const rows = await db
    .update(findings)
    .set({ status })
    .where(and(eq(findings.id, id), eq(findings.workspaceId, workspaceId)))
    .returning()
  return rows[0]
}

export interface ListFindingsOpts {
  runId?: string
  severity?: string
  status?: string
  category?: string
  limit?: number
  offset?: number
}

export async function listWorkspaceFindings(
  db: DbClient,
  workspaceId: string,
  opts: ListFindingsOpts = {},
): Promise<FindingRow[]> {
  const { runId, severity, status, category, limit = 50, offset = 0 } = opts

  const conds: SQL[] = [eq(findings.workspaceId, workspaceId)]
  if (runId) conds.push(eq(findings.runId, runId))
  if (severity) conds.push(eq(findings.severity, severity))
  if (status) conds.push(eq(findings.status, status))
  if (category) conds.push(eq(findings.category, category))

  return db
    .select()
    .from(findings)
    .where(and(...conds))
    .orderBy(desc(findings.createdAt))
    .limit(Math.min(limit, 100))
    .offset(offset)
}
