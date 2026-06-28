import { describe, it, expect } from 'vitest'
import { generateContract } from '../contract-writer.js'
import type { GenerationContext } from '../types.js'

const CTX: GenerationContext = {
  connectorName: 'Stripe',
  connectorType: 'REST',
  description: 'Stripe payment connector',
  features: [],
  outputLanguage: 'typescript',
  aiProvider: 'mock',
  aiModel: 'mock',
}

describe('generateContract()', () => {
  it('returns valid JSON', () => {
    expect(() => JSON.parse(generateContract(CTX))).not.toThrow()
  })

  it('spec has openapi 3.1.0', () => {
    const spec = JSON.parse(generateContract(CTX)) as { openapi: string }
    expect(spec.openapi).toBe('3.1.0')
  })

  it('includes list and get paths', () => {
    const spec = JSON.parse(generateContract(CTX)) as { paths: Record<string, unknown> }
    const paths = Object.keys(spec.paths)
    expect(paths.some((p) => p === '/stripe')).toBe(true)
    expect(paths.some((p) => p === '/stripe/{id}')).toBe(true)
  })

  it('includes schemas named after the connector', () => {
    const spec = JSON.parse(generateContract(CTX)) as {
      components: { schemas: Record<string, unknown> }
    }
    expect(spec.components.schemas).toHaveProperty('StripeResource')
    expect(spec.components.schemas).toHaveProperty('StripeListResponse')
  })

  it('uses connectorName in operationIds', () => {
    const spec = JSON.parse(generateContract(CTX)) as {
      paths: Record<string, { get?: { operationId?: string } }>
    }
    const listOp = spec.paths['/stripe']?.get?.operationId
    const getOp = spec.paths['/stripe/{id}']?.get?.operationId
    expect(listOp).toBe('Stripe_list')
    expect(getOp).toBe('Stripe_get')
  })
})
