import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pk = () => text('id').primaryKey().$defaultFn(() => nanoid())
const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
const workspaceFk = () => text('workspace_id').notNull().references(() => workspaces.id)

// ─── workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: pk(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'),
  retentionDays: integer('retention_days').notNull().default(30),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: pk(),
    workspaceId: workspaceFk(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    // owner | admin | editor | reviewer | viewer
    role: text('role').notNull().default('editor'),
    createdAt: createdAt(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' }),
  },
  (t) => [
    uniqueIndex('users_workspace_email_uidx').on(t.workspaceId, t.email),
    index('users_workspace_idx').on(t.workspaceId),
  ],
)

// ─── projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: pk(),
    workspaceId: workspaceFk(),
    name: text('name').notNull(),
    domain: text('domain').notNull().default('mcp-server-generation'),
    // active | archived
    status: text('status').notNull().default('active'),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => users.id),
    metadataJson: jsonb('metadata_json').notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('projects_workspace_idx').on(t.workspaceId),
    index('projects_workspace_status_idx').on(t.workspaceId, t.status),
  ],
)

// ─── runs ─────────────────────────────────────────────────────────────────────

export const runs = pgTable(
  'runs',
  {
    id: pk(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    // denormalized for workspace-level queries without JOIN
    workspaceId: workspaceFk(),
    // draft | ready | running | needs_input | completed | failed | cancelled
    status: text('status').notNull().default('draft'),
    // manual | scheduled | api | webhook
    triggerType: text('trigger_type').notNull().default('manual'),
    configJson: jsonb('config_json').notNull().default({}),
    inputHash: text('input_hash'),
    startedBy: text('started_by')
      .notNull()
      .references(() => users.id),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
  },
  (t) => [
    index('runs_project_idx').on(t.projectId),
    index('runs_workspace_idx').on(t.workspaceId),
    index('runs_workspace_status_idx').on(t.workspaceId, t.status),
    index('runs_status_idx').on(t.status),
  ],
)

// ─── input_items ──────────────────────────────────────────────────────────────

export const inputItems = pgTable(
  'input_items',
  {
    id: pk(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id),
    workspaceId: workspaceFk(),
    // connector_name | openapi_spec | docker_config | readme | env_vars | ...
    inputType: text('input_type').notNull(),
    label: text('label').notNull(),
    contentRef: text('content_ref').notNull(),
    // pending | valid | invalid | skipped
    validationStatus: text('validation_status').notNull().default('pending'),
    warningsJson: jsonb('warnings_json').notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [
    index('input_items_run_idx').on(t.runId),
    index('input_items_workspace_idx').on(t.workspaceId),
  ],
)

// ─── artifacts ────────────────────────────────────────────────────────────────

export const artifacts = pgTable(
  'artifacts',
  {
    id: pk(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id),
    workspaceId: workspaceFk(),
    // server | readme | docker | tests | contract | manifest | ...
    artifactType: text('artifact_type').notNull(),
    path: text('path').notNull(),
    contentRef: text('content_ref'),
    checksum: text('checksum'),
    // pending | valid | invalid
    validationStatus: text('validation_status').notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [
    index('artifacts_run_idx').on(t.runId),
    index('artifacts_workspace_idx').on(t.workspaceId),
    index('artifacts_run_type_idx').on(t.runId, t.artifactType),
  ],
)

// ─── findings ─────────────────────────────────────────────────────────────────

export const findings = pgTable(
  'findings',
  {
    id: pk(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id),
    workspaceId: workspaceFk(),
    // critical | high | medium | low | info
    severity: text('severity').notNull(),
    // security | correctness | style | advisory | performance
    category: text('category').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    evidenceRef: text('evidence_ref'),
    suggestedFix: text('suggested_fix'),
    // open | resolved | suppressed
    status: text('status').notNull().default('open'),
    createdAt: createdAt(),
  },
  (t) => [
    index('findings_run_idx').on(t.runId),
    index('findings_workspace_idx').on(t.workspaceId),
    index('findings_run_severity_idx').on(t.runId, t.severity),
    index('findings_workspace_status_idx').on(t.workspaceId, t.status),
  ],
)

// ─── review_events ────────────────────────────────────────────────────────────

export const reviewEvents = pgTable(
  'review_events',
  {
    id: pk(),
    runId: text('run_id')
      .notNull()
      .references(() => runs.id),
    workspaceId: workspaceFk(),
    reviewerUserId: text('reviewer_user_id')
      .notNull()
      .references(() => users.id),
    // approved | rejected | needs_revision
    decision: text('decision').notNull(),
    checklistVersion: text('checklist_version').notNull().default('v1'),
    notes: text('notes'),
    createdAt: createdAt(),
  },
  (t) => [
    index('review_events_run_idx').on(t.runId),
    index('review_events_workspace_idx').on(t.workspaceId),
  ],
)

// ─── audit_events ─────────────────────────────────────────────────────────────

export const auditEvents = pgTable(
  'audit_events',
  {
    id: pk(),
    workspaceId: workspaceFk(),
    // nullable for system-initiated events
    actorUserId: text('actor_user_id').references(() => users.id),
    // run.create | run.start | run.complete | run.fail | ...
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    metadataJson: jsonb('metadata_json').notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index('audit_events_workspace_idx').on(t.workspaceId),
    index('audit_events_workspace_action_idx').on(t.workspaceId, t.action),
    index('audit_events_target_idx').on(t.targetType, t.targetId),
    index('audit_events_created_at_idx').on(t.createdAt),
  ],
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  auditEvents: many(auditEvents),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [users.workspaceId], references: [workspaces.id] }),
  ownedProjects: many(projects),
  startedRuns: many(runs),
  reviewEvents: many(reviewEvents),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  owner: one(users, { fields: [projects.ownerUserId], references: [users.id] }),
  runs: many(runs),
}))

export const runsRelations = relations(runs, ({ one, many }) => ({
  project: one(projects, { fields: [runs.projectId], references: [projects.id] }),
  workspace: one(workspaces, { fields: [runs.workspaceId], references: [workspaces.id] }),
  startedByUser: one(users, { fields: [runs.startedBy], references: [users.id] }),
  inputItems: many(inputItems),
  artifacts: many(artifacts),
  findings: many(findings),
  reviewEvents: many(reviewEvents),
}))

export const inputItemsRelations = relations(inputItems, ({ one }) => ({
  run: one(runs, { fields: [inputItems.runId], references: [runs.id] }),
  workspace: one(workspaces, { fields: [inputItems.workspaceId], references: [workspaces.id] }),
}))

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  run: one(runs, { fields: [artifacts.runId], references: [runs.id] }),
  workspace: one(workspaces, { fields: [artifacts.workspaceId], references: [workspaces.id] }),
}))

export const findingsRelations = relations(findings, ({ one }) => ({
  run: one(runs, { fields: [findings.runId], references: [runs.id] }),
  workspace: one(workspaces, { fields: [findings.workspaceId], references: [workspaces.id] }),
}))

export const reviewEventsRelations = relations(reviewEvents, ({ one }) => ({
  run: one(runs, { fields: [reviewEvents.runId], references: [runs.id] }),
  workspace: one(workspaces, {
    fields: [reviewEvents.workspaceId],
    references: [workspaces.id],
  }),
  reviewer: one(users, {
    fields: [reviewEvents.reviewerUserId],
    references: [users.id],
  }),
}))

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  workspace: one(workspaces, { fields: [auditEvents.workspaceId], references: [workspaces.id] }),
  actor: one(users, { fields: [auditEvents.actorUserId], references: [users.id] }),
}))

// ─── Inferred types ───────────────────────────────────────────────────────────

export type WorkspaceRow = typeof workspaces.$inferSelect
export type NewWorkspaceRow = typeof workspaces.$inferInsert
export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
export type ProjectRow = typeof projects.$inferSelect
export type NewProjectRow = typeof projects.$inferInsert
export type RunRow = typeof runs.$inferSelect
export type NewRunRow = typeof runs.$inferInsert
export type InputItemRow = typeof inputItems.$inferSelect
export type NewInputItemRow = typeof inputItems.$inferInsert
export type ArtifactRow = typeof artifacts.$inferSelect
export type NewArtifactRow = typeof artifacts.$inferInsert
export type FindingRow = typeof findings.$inferSelect
export type NewFindingRow = typeof findings.$inferInsert
export type ReviewEventRow = typeof reviewEvents.$inferSelect
export type NewReviewEventRow = typeof reviewEvents.$inferInsert
export type AuditEventRow = typeof auditEvents.$inferSelect
export type NewAuditEventRow = typeof auditEvents.$inferInsert
