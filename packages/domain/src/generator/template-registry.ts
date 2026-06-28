import type { TemplateSet } from './types.js'
import { typescriptRestTemplate } from './templates/typescript-rest.js'
import { pythonRestTemplate } from './templates/python-rest.js'

type RegistryKey = string

function makeKey(connectorType: string, outputLanguage: string): RegistryKey {
  return `${connectorType.toLowerCase()}:${outputLanguage}`
}

const REGISTRY = new Map<RegistryKey, TemplateSet>([
  [makeKey('REST', 'typescript'), typescriptRestTemplate],
  [makeKey('GraphQL', 'typescript'), typescriptRestTemplate],
  [makeKey('gRPC', 'typescript'), typescriptRestTemplate],
  [makeKey('REST', 'python'), pythonRestTemplate],
  [makeKey('GraphQL', 'python'), pythonRestTemplate],
])

const FALLBACK_KEY = makeKey('REST', 'typescript')

export function getTemplate(connectorType: string, outputLanguage: string): TemplateSet {
  return (
    REGISTRY.get(makeKey(connectorType, outputLanguage)) ??
    REGISTRY.get(FALLBACK_KEY) ??
    typescriptRestTemplate
  )
}
