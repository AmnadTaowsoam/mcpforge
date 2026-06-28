import { z } from 'zod'
import type { Job } from 'bullmq'
import type { Logger } from 'pino'
import type { Env } from '@mcpforge/config'

// ─── Job data ─────────────────────────────────────────────────────────────────

export const inputSpecSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  inputType: z.string(),
})

export const generationConfigSchema = z.object({
  connectorName: z.string().min(1, 'connectorName is required'),
  connectorType: z.string().default('REST'),
  aiProvider: z.string().default('mock'),
  aiModel: z.string().default('mock'),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  outputLanguage: z.enum(['typescript', 'python']).default('typescript'),
})

export const generationJobDataSchema = z.object({
  runId: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  config: generationConfigSchema,
  inputs: z.array(inputSpecSchema).default([]),
})

export type InputSpec = z.infer<typeof inputSpecSchema>
export type GenerationConfig = z.infer<typeof generationConfigSchema>
export type GenerationJobData = z.infer<typeof generationJobDataSchema>

// ─── Pipeline state ───────────────────────────────────────────────────────────

export interface ValidatedInputs {
  connectorName: string
  connectorType: string
  description: string
  inputs: InputSpec[]
}

export interface GenerationContext {
  workspace: { id: string; name: string }
  project: { id: string; name: string }
  config: GenerationConfig
  inputs: InputSpec[]
}

export interface CoreWorkflowOutput {
  server: string
  readme: string
  tests: string
  dockerFile: string
  manifest: string
}

export interface PackagedArtifact {
  artifactType: string
  path: string
  content: string
  checksum: string
}

export interface GeneratedFinding {
  severity: string
  category: string
  title: string
  body: string
  suggestedFix?: string
}

export interface PipelineState {
  validatedInputs?: ValidatedInputs
  context?: GenerationContext
  coreOutput?: CoreWorkflowOutput
  findings?: GeneratedFinding[]
  artifacts?: PackagedArtifact[]
}

// ─── Step contract ────────────────────────────────────────────────────────────

export interface StepContext {
  job: Job<GenerationJobData>
  data: GenerationJobData
  log: Logger
  env: Env
  state: PipelineState
}

export type StepResult =
  | { ok: true; updates?: Partial<PipelineState> }
  | { ok: false; error: string; code: string; retryable: boolean }

export type StepHandler = (ctx: StepContext) => Promise<StepResult>

export interface PipelineStep {
  name: string
  handler: StepHandler
  progressEnd: number
}

// ─── Worker error ─────────────────────────────────────────────────────────────

export class WorkerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'WorkerError'
  }
}
