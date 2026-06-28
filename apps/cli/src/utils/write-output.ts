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

  await Promise.all([
    writeFile(join(outputDir, serverPath), out.server, 'utf-8'),
    writeFile(join(outputDir, 'README.md'), out.readme, 'utf-8'),
    writeFile(join(outputDir, testsPath), out.tests, 'utf-8'),
    writeFile(join(outputDir, 'Dockerfile'), out.dockerFile, 'utf-8'),
    writeFile(join(outputDir, 'mcp.manifest.json'), out.manifest, 'utf-8'),
  ])
}
