import { createHash } from 'node:crypto'
import type { GenerationContext, RenderedOutput } from './types.js'

export interface ReleaseEntry {
  path: string
  content: string
  checksum: string
  sizeBytes: number
}

export interface ReleasePackage {
  name: string
  version: string
  connectorType: string
  outputLanguage: string
  generatedAt: string
  files: ReleaseEntry[]
  checksumAlgorithm: 'sha256'
  totalFiles: number
}

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex')
}

function entry(path: string, content: string): ReleaseEntry {
  return { path, content, checksum: sha256(content), sizeBytes: Buffer.byteLength(content, 'utf-8') }
}

export function packageRelease(
  ctx: GenerationContext,
  rendered: RenderedOutput,
  contractJson: string,
): ReleasePackage {
  const isPython = ctx.outputLanguage === 'python'

  const files: ReleaseEntry[] = isPython
    ? [
        entry('server.py', rendered.server),
        entry('README.md', rendered.readme),
        entry('tests/test_server.py', rendered.tests),
        entry('Dockerfile', rendered.dockerFile),
        entry('mcp.manifest.json', rendered.manifest),
        entry('openapi.json', contractJson),
      ]
    : [
        entry('src/index.ts', rendered.server),
        entry('README.md', rendered.readme),
        entry('src/__tests__/index.test.ts', rendered.tests),
        entry('Dockerfile', rendered.dockerFile),
        entry('mcp.manifest.json', rendered.manifest),
        entry('openapi.json', contractJson),
      ]

  return {
    name: ctx.connectorName,
    version: '1.0.0',
    connectorType: ctx.connectorType,
    outputLanguage: ctx.outputLanguage,
    generatedAt: new Date().toISOString(),
    files,
    checksumAlgorithm: 'sha256',
    totalFiles: files.length,
  }
}
