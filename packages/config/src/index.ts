import { z } from 'zod'

// ─── Environment schema ───────────────────────────────────────────────────────
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4300),
  API_PORT: z.coerce.number().default(4300),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),

  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  AI_MODEL: z.string().default('mock'),

  APP_BASE_URL: z.string().url().default('http://localhost:4301'),
  API_BASE_URL: z.string().url().default('http://localhost:4300'),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),

  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORAGE_BUCKET: z.string().default('mcpforge-artifacts'),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),

  GITHUB_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),

  // Feature flags
  FEATURE_AI_GENERATION: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  FEATURE_EXPORT_JSON: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  FEATURE_EXPORT_MARKDOWN: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  FEATURE_PUBLIC_EXAMPLES: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  FEATURE_APPROVAL_GATES: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | undefined

export function validateEnv(raw = process.env): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Environment validation failed:\n${issues}`)
  }
  return result.data
}

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv()
  }
  return _env
}

export function isMockMode(): boolean {
  return getEnv().AI_PROVIDER === 'mock'
}

export function isDev(): boolean {
  return getEnv().NODE_ENV === 'development'
}

export function isProd(): boolean {
  return getEnv().NODE_ENV === 'production'
}
