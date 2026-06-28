import type { DbClient } from '../db/index.js'
import { createAuditEvent } from '../db/queries/audit-events.js'

export interface AuditOpts {
  workspaceId: string
  actorUserId?: string
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, unknown>
}

export async function writeAudit(db: DbClient, opts: AuditOpts): Promise<void> {
  await createAuditEvent(db, {
    workspaceId: opts.workspaceId,
    actorUserId: opts.actorUserId,
    action: opts.action,
    targetType: opts.targetType,
    targetId: opts.targetId,
    metadataJson: opts.metadata ?? {},
  })
}
