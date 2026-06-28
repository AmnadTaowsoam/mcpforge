import { Command, Option } from 'commander'
import { GeneratorEngine, generateContract } from '@mcpforge/domain'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { writeOutput } from '../utils/write-output.js'

interface GenerateOpts {
  name: string
  type: string
  lang: string
  output: string
  description: string
  features: string
  contract: boolean
}

export const generateCommand = new Command('generate')
  .description('Generate an MCP server from a connector definition')
  .requiredOption('-n, --name <name>', 'Connector name (e.g. Stripe, Github)')
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
  .option('-o, --output <dir>', 'Output directory', './mcp-server')
  .option('-d, --description <text>', 'Short description of the connector', '')
  .option('-f, --features <features>', 'Comma-separated feature flags', '')
  .option('--contract', 'Also write openapi.json contract file', false)
  .action(async (opts: GenerateOpts) => {
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
    const out = engine.generate(ctx)

    await writeOutput(opts.output, lang, out)

    if (opts.contract) {
      const contractJson = generateContract(ctx)
      await writeFile(join(opts.output, 'openapi.json'), contractJson, 'utf-8')
    }

    process.stdout.write(`\n✓  Generated ${opts.name} MCP server\n`)
    process.stdout.write(`   Output: ${opts.output}\n`)
    process.stdout.write(`   Language: ${lang}  Type: ${opts.type}\n`)
    if (opts.contract) process.stdout.write(`   Contract: ${opts.output}/openapi.json\n`)
    process.stdout.write(`\nNext steps:\n`)
    process.stdout.write(`  cd ${opts.output}\n`)
    if (lang === 'typescript') {
      process.stdout.write(`  npm install && npm run build && node dist/index.js\n\n`)
    } else {
      process.stdout.write(`  pip install mcp && python server.py\n\n`)
    }
  })
