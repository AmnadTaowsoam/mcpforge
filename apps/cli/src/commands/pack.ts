import { Command, Option } from 'commander'
import { GeneratorEngine, generateContract, packageRelease } from '@mcpforge/domain'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

interface PackOpts {
  name: string
  type: string
  lang: string
  output: string
  description: string
  features: string
}

export const packCommand = new Command('pack')
  .description('Generate an MCP server and bundle it as a release package (JSON manifest)')
  .requiredOption('-n, --name <name>', 'Connector name')
  .addOption(
    new Option('-t, --type <type>', 'Connector type')
      .choices(['REST', 'GraphQL', 'gRPC'])
      .default('REST'),
  )
  .addOption(
    new Option('-l, --lang <lang>', 'Output language')
      .choices(['typescript', 'python'])
      .default('typescript'),
  )
  .option('-o, --output <dir>', 'Output directory for release package', './mcp-release')
  .option('-d, --description <text>', 'Connector description', '')
  .option('-f, --features <features>', 'Comma-separated feature flags', '')
  .action(async (opts: PackOpts) => {
    const features = opts.features
      ? opts.features.split(',').map((f) => f.trim()).filter(Boolean)
      : []

    const lang = opts.lang as 'typescript' | 'python'
    const ctx = {
      connectorName: opts.name,
      connectorType: opts.type,
      description: opts.description,
      features,
      outputLanguage: lang,
      aiProvider: 'mock',
      aiModel: 'mock',
    }

    const engine = new GeneratorEngine()
    const rendered = engine.generate(ctx)
    const contractJson = generateContract(ctx)
    const release = packageRelease(ctx, rendered, contractJson)

    await mkdir(opts.output, { recursive: true })
    const releasePath = join(opts.output, `${opts.name.toLowerCase()}-release.json`)
    await writeFile(releasePath, JSON.stringify(release, null, 2), 'utf-8')

    process.stdout.write(`\n✓  Packaged ${opts.name} MCP release\n`)
    process.stdout.write(`   Files: ${release.totalFiles}\n`)
    process.stdout.write(`   Release: ${releasePath}\n\n`)

    for (const f of release.files) {
      process.stdout.write(`   ${f.path.padEnd(40)} ${f.checksum.slice(0, 12)}…  ${f.sizeBytes}B\n`)
    }
    process.stdout.write('\n')
  })
