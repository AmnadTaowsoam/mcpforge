import { describe, it, expect } from 'vitest'
import { GeneratorEngine } from '../engine.js'
import { generateContract } from '../contract-writer.js'
import { packageRelease } from '../release-packager.js'

const engine = new GeneratorEngine()

const TS_CTX = {
  connectorName: 'Stripe',
  connectorType: 'REST',
  description: 'Stripe payment connector',
  features: ['pagination'],
  outputLanguage: 'typescript' as const,
  aiProvider: 'mock',
  aiModel: 'mock',
}

const PY_CTX = { ...TS_CTX, connectorName: 'GitHub', outputLanguage: 'python' as const }

describe('Golden-file snapshots — TypeScript REST', () => {
  const out = engine.generate(TS_CTX)

  it('server code matches snapshot', () => {
    // Strip generatedAt timestamp to keep snapshot stable
    expect(out.server).toMatchSnapshot()
  })

  it('readme matches snapshot', () => {
    const stableReadme = out.readme.replace(/\d{4}-\d{2}-\d{2}T[^\s.]+\.\d+Z/g, '<TIMESTAMP>')
    expect(stableReadme).toMatchSnapshot()
  })

  it('test stub matches snapshot', () => {
    expect(out.tests).toMatchSnapshot()
  })

  it('Dockerfile matches snapshot', () => {
    expect(out.dockerFile).toMatchSnapshot()
  })

  it('manifest has expected shape (without generatedAt)', () => {
    const m = JSON.parse(out.manifest) as Record<string, unknown>
    const { generatedAt: _, ...stable } = m
    expect(stable).toMatchSnapshot()
  })
})

describe('Golden-file snapshots — Python REST', () => {
  const out = engine.generate(PY_CTX)

  it('python server starts with shebang', () => {
    expect(out.server.startsWith('#!/usr/bin/env python3')).toBe(true)
  })

  it('python server matches snapshot', () => {
    const stable = out.server.replace(/\d{4}-\d{2}-\d{2}T[^\s"]+Z/g, '<TIMESTAMP>')
    expect(stable).toMatchSnapshot()
  })
})

describe('Golden-file snapshots — OpenAPI contract', () => {
  const contract = generateContract(TS_CTX)

  it('contract is valid JSON', () => {
    expect(() => JSON.parse(contract)).not.toThrow()
  })

  it('contract matches snapshot', () => {
    expect(contract).toMatchSnapshot()
  })
})

describe('Golden-file snapshots — Release package', () => {
  const out = engine.generate(TS_CTX)
  const contract = generateContract(TS_CTX)
  const pkg = packageRelease(TS_CTX, out, contract)

  it('release file list matches snapshot', () => {
    const paths = pkg.files.map((f) => f.path).sort()
    expect(paths).toMatchSnapshot()
  })

  it('all checksums are 64-char hex', () => {
    expect(pkg.files.every((f) => /^[0-9a-f]{64}$/.test(f.checksum))).toBe(true)
  })
})
