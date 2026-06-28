import { describe, it, expect } from 'vitest'
import { GeneratorEngine } from '../engine.js'
import { validateManifest } from '../manifest-validator.js'
import type { GenerationContext } from '../types.js'

const BASE: GenerationContext = {
  connectorName: 'TestConnector',
  connectorType: 'REST',
  description: 'A test connector',
  features: ['pagination'],
  outputLanguage: 'typescript',
  aiProvider: 'mock',
  aiModel: 'mock',
}

describe('GeneratorEngine', () => {
  const engine = new GeneratorEngine()

  it('returns all required output fields', () => {
    const out = engine.generate(BASE)
    expect(out).toHaveProperty('server')
    expect(out).toHaveProperty('readme')
    expect(out).toHaveProperty('tests')
    expect(out).toHaveProperty('dockerFile')
    expect(out).toHaveProperty('manifest')
  })

  it('interpolates connectorName into server code', () => {
    const out = engine.generate(BASE)
    expect(out.server).toContain('TestConnector')
  })

  it('generates a valid manifest', () => {
    const out = engine.generate(BASE)
    const r = validateManifest(out.manifest)
    expect(r.valid).toBe(true)
  })

  it('manifest tools reference connectorName', () => {
    const out = engine.generate(BASE)
    const manifest = JSON.parse(out.manifest) as { tools: string[] }
    expect(manifest.tools.every((t) => t.startsWith('TestConnector'))).toBe(true)
  })

  it('generates Python output when outputLanguage is python', () => {
    const out = engine.generate({ ...BASE, outputLanguage: 'python' })
    expect(out.server).toMatch(/#!/)
    expect(out.server).toContain('asyncio')
  })

  it('includes features comment in server output', () => {
    const out = engine.generate({ ...BASE, features: ['pagination', 'webhooks'] })
    expect(out.server).toContain('pagination')
  })

  it('falls back gracefully for unknown connectorType', () => {
    const out = engine.generate({ ...BASE, connectorType: 'Unknown' })
    expect(out.server).toBeTruthy()
    expect(validateManifest(out.manifest).valid).toBe(true)
  })
})
