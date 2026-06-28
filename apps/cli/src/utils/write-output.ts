import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RenderedOutput } from '@mcpforge/domain'

export async function writeOutput(
  outputDir: string,
  lang: 'typescript' | 'python',
  out: RenderedOutput,
): Promise<void> {
  const isPython = lang === 'python'

  await mkdir(
    join(outputDir, isPython ? 'tests' : join('src', '__tests__')),
    { recursive: true },
  )

  const serverPath = isPython ? 'server.py' : join('src', 'index.ts')
  const testsPath = isPython
    ? join('tests', 'test_server.py')
    : join('src', '__tests__', 'index.test.ts')

  const writes: Promise<void>[] = [
    writeFile(join(outputDir, serverPath), out.server, 'utf-8'),
    writeFile(join(outputDir, 'README.md'), out.readme, 'utf-8'),
    writeFile(join(outputDir, testsPath), out.tests, 'utf-8'),
    writeFile(join(outputDir, 'Dockerfile'), out.dockerFile, 'utf-8'),
    writeFile(join(outputDir, 'mcp.manifest.json'), out.manifest, 'utf-8'),
  ]

  if (out.packageJson) {
    const pkgPath = isPython ? 'pyproject.toml' : 'package.json'
    writes.push(writeFile(join(outputDir, pkgPath), out.packageJson, 'utf-8'))
    if (isPython) {
      writes.push(writeFile(join(outputDir, 'requirements.txt'), 'mcp>=1.0.0\n', 'utf-8'))
    }
  }

  if (out.tsconfig && !isPython) {
    writes.push(writeFile(join(outputDir, 'tsconfig.json'), out.tsconfig, 'utf-8'))
  }

  await Promise.all(writes)
}
