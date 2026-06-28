// ─── Workspace ────────────────────────────────────────────────────────────────
export interface Workspace {
  id: string
  name: string
  plan: string
  retentionDays: number
  createdAt: Date
  updatedAt: Date
}

// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer'

export interface User {
  id: string
  workspaceId: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Date
  lastSeenAt: Date | null
}

// ─── Project ──────────────────────────────────────────────────────────────────
export type ProjectStatus = 'active' | 'archived'

export interface Project {
  id: string
  workspaceId: string
  name: string
  domain: 'mcp-server-generation'
  status: ProjectStatus
  ownerUserId: string
  metadataJson: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// ─── Run ──────────────────────────────────────────────────────────────────────
export type RunStatus =
  | 'draft'
  | 'ready'
  | 'running'
  | 'needs_input'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type RunTriggerType = 'manual' | 'api' | 'cli'

export interface Run {
  id: string
  projectId: string
  status: RunStatus
  triggerType: RunTriggerType
  configJson: Record<string, unknown>
  inputHash: string | null
  startedBy: string
  startedAt: Date | null
  completedAt: Date | null
  failureCode: string | null
  failureMessage: string | null
}

// ─── Input Item ───────────────────────────────────────────────────────────────
export type InputType =
  | 'connector_name'
  | 'target_platform'
  | 'tool_list'
  | 'auth_model'
  | 'api_references'
  | 'data_contracts'
  | 'deployment_preference'
  | 'custom'

export type ValidationStatus = 'pending' | 'valid' | 'warning' | 'invalid'

export interface InputItem {
  id: string
  runId: string
  inputType: InputType
  label: string
  contentRef: string | null
  validationStatus: ValidationStatus
  warningsJson: string[]
  createdAt: Date
}

// ─── Artifact ─────────────────────────────────────────────────────────────────
export type ArtifactType =
  | 'server'
  | 'tool'
  | 'contract'
  | 'test'
  | 'dockerfile'
  | 'docker-compose'
  | 'env-example'
  | 'readme'
  | 'docs'
  | 'manifest'
  | 'export-markdown'
  | 'export-json'
  | 'export-zip'

export interface Artifact {
  id: string
  runId: string
  artifactType: ArtifactType
  path: string
  contentRef: string | null
  checksum: string | null
  validationStatus: ValidationStatus
  createdAt: Date
}

// ─── Finding ──────────────────────────────────────────────────────────────────
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type FindingStatus = 'open' | 'resolved' | 'waived'
export type FindingCategory =
  | 'security'
  | 'correctness'
  | 'completeness'
  | 'credential-leak'
  | 'contract-violation'
  | 'build-failure'
  | 'advisory'

export interface Finding {
  id: string
  runId: string
  severity: FindingSeverity
  category: FindingCategory
  title: string
  body: string
  evidenceRef: string | null
  suggestedFix: string | null
  status: FindingStatus
  createdAt: Date
}

// ─── Review Event ─────────────────────────────────────────────────────────────
export type ReviewDecision = 'approved' | 'changes_requested' | 'waived'

export interface ReviewEvent {
  id: string
  runId: string
  reviewerUserId: string
  decision: ReviewDecision
  checklistVersion: string
  notes: string | null
  createdAt: Date
}

// ─── Audit Event ──────────────────────────────────────────────────────────────
export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'project.create'
  | 'project.update'
  | 'run.create'
  | 'run.cancel'
  | 'artifact.create'
  | 'finding.create'
  | 'review.submit'
  | 'export.complete'
  | 'integration.call'
  | 'policy.waiver'

export interface AuditEvent {
  id: string
  workspaceId: string
  actorUserId: string
  action: AuditAction
  targetType: string | null
  targetId: string | null
  metadataJson: Record<string, unknown>
  createdAt: Date
}

// ─── Generator Engine ─────────────────────────────────────────────────────────
export type {
  GenerationContext as GeneratorContext,
  RenderedOutput,
  TemplateSet,
  TemplateVars,
  ManifestValidationResult,
} from './generator/index.js'
export {
  render,
  getTemplate,
  validateManifest,
  GeneratorEngine,
  generateContract,
  packageRelease,
} from './generator/index.js'
export type { OpenApiSpec, ReleasePackage, ReleaseEntry } from './generator/index.js'
export { EXAMPLE_CONNECTORS, findExample } from './examples/index.js'
export type { ExampleConnector } from './examples/index.js'

// ─── Generator Inputs ─────────────────────────────────────────────────────────
export interface GeneratorInput {
  connectorName: string
  targetPlatform: string
  tools: string[]
  authModel: 'none' | 'api-key' | 'oauth2' | 'basic'
  apiReferences?: string[]
  dataContracts?: Record<string, unknown>
  deploymentPreference?: 'docker' | 'kubernetes' | 'local'
}

export interface GeneratorOutput {
  name: string
  outputPath: string
  tools: string[]
  files: string[]
  status: 'success' | 'partial' | 'failed'
  warnings: string[]
}
