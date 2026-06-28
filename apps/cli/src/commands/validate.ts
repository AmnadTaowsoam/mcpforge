import { Command } from 'commander'
import { readFile } from 'node:fs/promises'
import { validateManifest } from '@mcpforge/domain'

interface ValidateOpts {
  manifest: string
}

export const validateCommand = new Command('validate')
  .description('Validate an mcp.manifest.json file')
  .option('-m, --manifest <path>', 'Path to manifest file', 'mcp.manifest.json')
  .action(async (opts: ValidateOpts) => {
    let content: string
    try {
      content = await readFile(opts.manifest, 'utf-8')
    } catch {
      process.stderr.write(`Error: Cannot read file "${opts.manifest}"\n`)
      process.exit(1)
    }

    const result = validateManifest(content)

    if (result.valid) {
      const parsed = JSON.parse(content) as Record<string, unknown>
      process.stdout.write(`✓  Manifest is valid\n`)
      process.stdout.write(`   name: ${String(parsed['name'] ?? '')}\n`)
      process.stdout.write(`   version: ${String(parsed['version'] ?? '')}\n`)
      process.stdout.write(`   mcpVersion: ${String(parsed['mcpVersion'] ?? '')}\n`)
      const tools = parsed['tools']
      if (Array.isArray(tools)) {
        process.stdout.write(`   tools: ${tools.length} registered\n`)
      }
    } else {
      process.stderr.write(`✗  Manifest has ${result.errors.length} error(s):\n`)
      for (const err of result.errors) {
        process.stderr.write(`   - ${err}\n`)
      }
      process.exit(1)
    }
  })
