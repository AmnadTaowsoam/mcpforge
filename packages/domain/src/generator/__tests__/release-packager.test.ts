import { describe, it, expect } from 'vitest'
import { GeneratorEngine } from '../engine.js'
import { generateContract } from '../contract-writer.js'
import { packageRelease } from '../release-packager.js'
import type { GenerationContext } from '../types.js'

const CTX: GenerationContext = {
  connectorName: 'GitHub',
  connectorType: 'REST',
  description: 'GitHub connector',
  features: [],
  outputLanguage: 'typescript',
  aiProvider: 'mock',
  aiModel: 'mock',
}

describe('packageRelease()', () => {
  const engine = new GeneratorEngine()
  const rendered = engine.generate(CTX)
  const contract = generateContract(CTX)
  const pkg = packageRelease(CTX, rendered, contract)

  it('includes all expected files', () => {
    const paths = pkg.files.map((f) => f.path)
    expect(paths).toContain('src/index.ts')
    expect(paths).toContain('README.md')
    expect(paths).toContain('Dockerfile')
    expect(paths).toContain('mcp.manifest.json')
    expect(paths).toContain('openapi.json')
  })

  it('totalFiles matches files array length', () => {
    expect(pkg.totalFiles).toBe(pkg.files.length)
  })

  it('each entry has a non-empty sha256 checksum', () => {
    for (const f of pkg.files) {
      expect(f.checksum).toHaveLength(64)
      expect(f.checksum).toMatch(/^[0-9a-f]+$/)
    }
  })

  it('checksumAlgorithm is sha256', () => {
    expect(pkg.checksumAlgorithm).toBe('sha256')
  })

  it('Python release uses server.py path', () => {
    const pyCtx: GenerationContext = { ...CTX, outputLanguage: 'python' }
    const pyRendered = engine.generate(pyCtx)
    const pyPkg = packageRelease(pyCtx, pyRendered, contract)
    const paths = pyPkg.files.map((f) => f.path)
    expect(paths).toContain('server.py')
    expect(paths).toContain('tests/test_server.py')
  })

  it('connector metadata is set correctly', () => {
    expect(pkg.name).toBe('GitHub')
    expect(pkg.connectorType).toBe('REST')
    expect(pkg.outputLanguage).toBe('typescript')
  })
})
