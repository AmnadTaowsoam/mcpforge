import { eq, and, desc } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { projects } from '../schema.js'
import type { ProjectRow, NewProjectRow } from '../schema.js'

export async function listProjects(
  db: DbClient,
  workspaceId: string,
): Promise<ProjectRow[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(desc(projects.createdAt))
}

export async function getProjectById(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<ProjectRow | undefined> {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .limit(1)
  return rows[0]
}

export async function createProject(
  db: DbClient,
  data: NewProjectRow,
): Promise<ProjectRow> {
  const rows = await db.insert(projects).values(data).returning()
  const row = rows[0]
  if (!row) throw new Error('createProject: insert returned no rows')
  return row
}

export async function updateProject(
  db: DbClient,
  id: string,
  workspaceId: string,
  data: Partial<Pick<NewProjectRow, 'name' | 'status' | 'metadataJson'>>,
): Promise<ProjectRow | undefined> {
  const rows = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning()
  return rows[0]
}

export async function deleteProject(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<boolean> {
  const rows = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning({ id: projects.id })
  return rows.length > 0
}
