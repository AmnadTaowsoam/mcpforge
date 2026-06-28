import { eq, and } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { users } from '../schema.js'
import type { UserRow } from '../schema.js'

export async function getUserByEmailInWorkspace(
  db: DbClient,
  workspaceId: string,
  email: string,
): Promise<UserRow | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.workspaceId, workspaceId), eq(users.email, email)))
    .limit(1)
  return rows[0]
}

export async function getUserById(
  db: DbClient,
  id: string,
): Promise<UserRow | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0]
}

export async function touchLastSeen(db: DbClient, id: string): Promise<void> {
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, id))
}
