import { eq, and, desc, type SQL } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { auditEvents } from '../schema.js'
import type { AuditEventRow, NewAuditEventRow } from '../schema.js'

export async function createAuditEvent(
  db: DbClient,
  data: NewAuditEventRow,
): Promise<void> {
  await db.insert(auditEvents).values(data)
}

export interface ListAuditOpts {
  action?: string
  targetType?: string
  targetId?: string
  actorUserId?: string
  limit?: number
  offset?: number
}

export async function listWorkspaceAuditEvents(
  db: DbClient,
  workspaceId: string,
  opts: ListAuditOpts = {},
): Promise<AuditEventRow[]> {
  const { action, targetType, targetId, actorUserId, limit = 50, offset = 0 } = opts

  const conds: SQL[] = [eq(auditEvents.workspaceId, workspaceId)]
  if (action) conds.push(eq(auditEvents.action, action))
  if (targetType) conds.push(eq(auditEvents.targetType, targetType))
  if (targetId) conds.push(eq(auditEvents.targetId, targetId))
  if (actorUserId) conds.push(eq(auditEvents.actorUserId, actorUserId))

  return db
    .select()
    .from(auditEvents)
    .where(and(...conds))
    .orderBy(desc(auditEvents.createdAt))
    .limit(Math.min(limit, 200))
    .offset(offset)
}
