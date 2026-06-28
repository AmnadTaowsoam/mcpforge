import { eq } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { workspaces, users } from '../schema.js'
import type { WorkspaceRow, UserRow } from '../schema.js'

export async function getWorkspaceById(
  db: DbClient,
  id: string,
): Promise<WorkspaceRow | undefined> {
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1)
  return rows[0]
}

export async function updateWorkspace(
  db: DbClient,
  id: string,
  data: Partial<Pick<WorkspaceRow, 'name' | 'plan' | 'retentionDays'>>,
): Promise<WorkspaceRow | undefined> {
  const rows = await db
    .update(workspaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspaces.id, id))
    .returning()
  return rows[0]
}

export async function getWorkspaceMembers(
  db: DbClient,
  workspaceId: string,
): Promise<UserRow[]> {
  return db.select().from(users).where(eq(users.workspaceId, workspaceId))
}
