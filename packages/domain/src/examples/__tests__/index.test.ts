import { describe, it, expect } from 'vitest'
import { EXAMPLE_CONNECTORS, findExample } from '../index.js'

describe('EXAMPLE_CONNECTORS', () => {
  it('has at least 4 entries', () => {
    expect(EXAMPLE_CONNECTORS.length).toBeGreaterThanOrEqual(4)
  })

  it('every entry has required fields', () => {
    for (const ex of EXAMPLE_CONNECTORS) {
      expect(ex.id).toBeTruthy()
      expect(ex.label).toBeTruthy()
      expect(ex.context.connectorName).toBeTruthy()
      expect(['typescript', 'python']).toContain(ex.context.outputLanguage)
    }
  })

  it('ids are unique', () => {
    const ids = EXAMPLE_CONNECTORS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('findExample()', () => {
  it('finds stripe by id', () => {
    const ex = findExample('stripe')
    expect(ex).toBeDefined()
    expect(ex?.label).toBe('Stripe')
  })

  it('returns undefined for unknown id', () => {
    expect(findExample('doesnotexist')).toBeUndefined()
  })
})
