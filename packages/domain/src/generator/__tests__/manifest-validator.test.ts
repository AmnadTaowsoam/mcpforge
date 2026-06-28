import { describe, it, expect } from 'vitest'
import { validateManifest } from '../manifest-validator.js'

const VALID = JSON.stringify({
  name: 'Stripe',
  version: '1.0.0',
  mcpVersion: '1.0',
  tools: ['Stripe_list', 'Stripe_get'],
})

describe('validateManifest()', () => {
  it('accepts a valid manifest', () => {
    const r = validateManifest(VALID)
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('rejects non-JSON input', () => {
    const r = validateManifest('not json{{{')
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toMatch(/not valid JSON/i)
  })

  it('rejects a JSON array', () => {
    const r = validateManifest('[]')
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toMatch(/object/i)
  })

  it('reports each missing required field', () => {
    const r = validateManifest('{}')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('Missing required field: name')
    expect(r.errors).toContain('Missing required field: version')
    expect(r.errors).toContain('Missing required field: mcpVersion')
    expect(r.errors).toContain('Missing required field: tools')
  })

  it('rejects tools field that is not an array', () => {
    const r = validateManifest(JSON.stringify({ name: 'X', version: '1', mcpVersion: '1', tools: 'bad' }))
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('"tools"'))).toBe(true)
  })

  it('rejects version that is not a string', () => {
    const r = validateManifest(JSON.stringify({ name: 'X', version: 42, mcpVersion: '1', tools: [] }))
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('"version"'))).toBe(true)
  })
})
