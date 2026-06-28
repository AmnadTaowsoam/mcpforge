import { eq, and, desc } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { reviewEvents } from '../schema.js'
import type { ReviewEventRow, NewReviewEventRow } from '../schema.js'

export async function createReviewEvent(
  db: DbClient,
  data: NewReviewEventRow,
): Promise<ReviewEventRow> {
  const rows = await db.insert(reviewEvents).values(data).returning()
  const row = rows[0]
  if (!row) throw new Error('createReviewEvent: insert returned no rows')
  return row
}

export async function listRunReviewEvents(
  db: DbClient,
  runId: string,
  workspaceId: string,
): Promise<ReviewEventRow[]> {
  return db
    .select()
    .from(reviewEvents)
    .where(and(eq(reviewEvents.runId, runId), eq(reviewEvents.workspaceId, workspaceId)))
    .orderBy(desc(reviewEvents.createdAt))
}
