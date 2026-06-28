import { eq, and } from 'drizzle-orm'
import type { DbClient } from '../index.js'
import { inputItems } from '../schema.js'
import type { InputItemRow, NewInputItemRow } from '../schema.js'

export async function listInputItems(
  db: DbClient,
  runId: string,
  workspaceId: string,
): Promise<InputItemRow[]> {
  return db
    .select()
    .from(inputItems)
    .where(and(eq(inputItems.runId, runId), eq(inputItems.workspaceId, workspaceId)))
}

export async function getInputItemById(
  db: DbClient,
  id: string,
  workspaceId: string,
): Promise<InputItemRow | undefined> {
  const rows = await db
    .select()
    .from(inputItems)
    .where(and(eq(inputItems.id, id), eq(inputItems.workspaceId, workspaceId)))
    .limit(1)
  return rows[0]
}

export async function createInputItem(
  db: DbClient,
  data: NewInputItemRow,
): Promise<InputItemRow> {
  const rows = await db.insert(inputItems).values(data).returning()
  const row = rows[0]
  if (!row) throw new Error('createInputItem: insert returned no rows')
  return row
}

export async function updateInputValidation(
  db: DbClient,
  id: string,
  workspaceId: string,
  validationStatus: 'valid' | 'invalid' | 'pending' | 'skipped',
  warnings: string[],
): Promise<InputItemRow | undefined> {
  const rows = await db
    .update(inputItems)
    .set({ validationStatus, warningsJson: warnings })
    .where(and(eq(inputItems.id, id), eq(inputItems.workspaceId, workspaceId)))
    .returning()
  return rows[0]
}

export async function updateInputContent(
  db: DbClient,
  id: string,
  workspaceId: string,
  contentRef: string,
): Promise<InputItemRow | undefined> {
  const rows = await db
    .update(inputItems)
    .set({ contentRef, validationStatus: 'pending', warningsJson: [] })
    .where(and(eq(inputItems.id, id), eq(inputItems.workspaceId, workspaceId)))
    .returning()
  return rows[0]
}
