import { eq, and, desc, type SQL } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { artifacts } from '../schema.js'
import type { ArtifactRow } from '../schema.js'

export async function getArtifactById(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<ArtifactRow | undefined> {
  const rows = await db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.id, id), eq(artifacts.workspaceId, workspaceId)))
    .limit(1)
  return rows[0]
}

export interface ListArtifactsOpts {
  runId?: string
  artifactType?: string
  limit?: number
  offset?: number
}

export async function listWorkspaceArtifacts(
  db: DbClient,
  workspaceId: string,
  opts: ListArtifactsOpts = {},
): Promise<ArtifactRow[]> {
  const { runId, artifactType, limit = 50, offset = 0 } = opts

  const conds: SQL[] = [eq(artifacts.workspaceId, workspaceId)]
  if (runId) conds.push(eq(artifacts.runId, runId))
  if (artifactType) conds.push(eq(artifacts.artifactType, artifactType))

  return db
    .select()
    .from(artifacts)
    .where(and(...conds))
    .orderBy(desc(artifacts.createdAt))
    .limit(Math.min(limit, 100))
    .offset(offset)
}
