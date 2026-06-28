import type {
  Workspace,
  User,
  Project,
  Run,
  InputItem,
  Artifact,
  Finding,
  ReviewEvent,
  AuditEvent,
} from '@mcpforge/domain'

// ─── ID factory ───────────────────────────────────────────────────────────────
let _seq = 1
function nextId(): string {
  return `test-id-${_seq++}`
}

// ─── Workspace factory ────────────────────────────────────────────────────────
export function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: nextId(),
    name: 'test-workspace',
    plan: 'free',
    retentionDays: 30,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── User factory ─────────────────────────────────────────────────────────────
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId(),
    workspaceId: nextId(),
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'editor',
    createdAt: new Date('2026-01-01'),
    lastSeenAt: null,
    ...overrides,
  }
}

// ─── Project factory ──────────────────────────────────────────────────────────
export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: nextId(),
    workspaceId: nextId(),
    name: 'test-project',
    domain: 'mcp-server-generation',
    status: 'active',
    ownerUserId: nextId(),
    metadataJson: {},
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── Run factory ──────────────────────────────────────────────────────────────
export function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: nextId(),
    projectId: nextId(),
    status: 'draft',
    triggerType: 'manual',
    configJson: {},
    inputHash: null,
    startedBy: nextId(),
    startedAt: null,
    completedAt: null,
    failureCode: null,
    failureMessage: null,
    ...overrides,
  }
}

// ─── InputItem factory ────────────────────────────────────────────────────────
export function makeInputItem(overrides: Partial<InputItem> = {}): InputItem {
  return {
    id: nextId(),
    runId: nextId(),
    inputType: 'connector_name',
    label: 'Connector Name',
    contentRef: 'test-connector',
    validationStatus: 'valid',
    warningsJson: [],
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── Artifact factory ─────────────────────────────────────────────────────────
export function makeArtifact(overrides: Partial<Artifact> = {}): Artifact {
  return {
    id: nextId(),
    runId: nextId(),
    artifactType: 'server',
    path: 'server/index.ts',
    contentRef: null,
    checksum: null,
    validationStatus: 'valid',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── Finding factory ──────────────────────────────────────────────────────────
export function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: nextId(),
    runId: nextId(),
    severity: 'info',
    category: 'advisory',
    title: 'Test finding',
    body: 'Test finding body',
    evidenceRef: null,
    suggestedFix: null,
    status: 'open',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── ReviewEvent factory ──────────────────────────────────────────────────────
export function makeReviewEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    id: nextId(),
    runId: nextId(),
    reviewerUserId: nextId(),
    decision: 'approved',
    checklistVersion: 'v1',
    notes: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── AuditEvent factory ───────────────────────────────────────────────────────
export function makeAuditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: nextId(),
    workspaceId: nextId(),
    actorUserId: nextId(),
    action: 'run.create',
    targetType: 'run',
    targetId: nextId(),
    metadataJson: {},
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}
