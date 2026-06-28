import { describe, it, expect } from 'vitest'
import { validateEnv, isMockMode } from './index.js'

const base = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/mcpforge',
  JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
  ENCRYPTION_KEY: 'test-encryption-key-32-bytes-min!',
}

describe('validateEnv', () => {
  it('accepts valid env with required fields', () => {
    const env = validateEnv({ ...base })
    expect(env.DATABASE_URL).toBe(base.DATABASE_URL)
    expect(env.AI_PROVIDER).toBe('mock')
    expect(env.NODE_ENV).toBe('development')
  })

  it('throws on missing DATABASE_URL', () => {
    expect(() =>
      validateEnv({ JWT_SECRET: base.JWT_SECRET, ENCRYPTION_KEY: base.ENCRYPTION_KEY })
    ).toThrow('Environment validation failed')
  })

  it('throws on JWT_SECRET shorter than 32 chars', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow()
  })

  it('throws on invalid AI_PROVIDER value', () => {
    expect(() => validateEnv({ ...base, AI_PROVIDER: 'unknown' })).toThrow()
  })

  it('applies feature flag defaults', () => {
    const env = validateEnv({ ...base })
    expect(env.FEATURE_AI_GENERATION).toBe(true)
    expect(env.FEATURE_EXPORT_JSON).toBe(true)
    expect(env.FEATURE_APPROVAL_GATES).toBe(true)
  })

  it('parses feature flag string "false"', () => {
    const env = validateEnv({ ...base, FEATURE_AI_GENERATION: 'false' })
    expect(env.FEATURE_AI_GENERATION).toBe(false)
  })

  it('coerces PORT to number', () => {
    const env = validateEnv({ ...base, PORT: '9999' })
    expect(env.PORT).toBe(9999)
  })

  it('returns AI_PROVIDER=mock for isMockMode check via validateEnv result', () => {
    const env = validateEnv({ ...base, AI_PROVIDER: 'mock' })
    expect(env.AI_PROVIDER).toBe('mock')
  })

  it('returns NODE_ENV for isDev check via validateEnv result', () => {
    const env = validateEnv({ ...base, NODE_ENV: 'development' })
    expect(env.NODE_ENV).toBe('development')
  })
})

describe('isMockMode (via process.env singleton)', () => {
  it('returns true when process.env sets AI_PROVIDER=mock', () => {
    process.env['DATABASE_URL'] = base.DATABASE_URL
    process.env['JWT_SECRET'] = base.JWT_SECRET
    process.env['ENCRYPTION_KEY'] = base.ENCRYPTION_KEY
    process.env['AI_PROVIDER'] = 'mock'
    // isMockMode() → getEnv() → validateEnv(process.env) → caches _env
    expect(isMockMode()).toBe(true)
  })
})
