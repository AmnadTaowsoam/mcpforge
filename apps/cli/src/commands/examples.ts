import { Command } from 'commander'
import { EXAMPLE_CONNECTORS, findExample } from '@mcpforge/domain'

export const examplesCommand = new Command('examples')
  .description('Browse the MCPForge example connector gallery')
  .option('-i, --id <id>', 'Show details for a specific example (e.g. stripe, github)')
  .action((opts: { id?: string }) => {
    if (opts.id) {
      const ex = findExample(opts.id)
      if (!ex) {
        process.stderr.write(`Example "${opts.id}" not found. Run "mcpforge examples" to list all.\n`)
        process.exit(1)
      }
      process.stdout.write(`\n${ex.label} — ${ex.description}\n`)
      process.stdout.write(`Tags: ${ex.tags.join(', ')}\n\n`)
      process.stdout.write(`Generate command:\n`)
      const ctx = ex.context
      process.stdout.write(
        `  mcpforge generate --name ${ctx.connectorName} --type ${ctx.connectorType} --lang ${ctx.outputLanguage}`,
      )
      if (ctx.features.length > 0) {
        process.stdout.write(` --features ${ctx.features.join(',')}`)
      }
      process.stdout.write(` --contract\n\n`)
      return
    }

    process.stdout.write('\nMCPForge Example Gallery:\n\n')
    process.stdout.write('  ID           LABEL          LANGUAGE     DESCRIPTION\n')
    process.stdout.write('  ────────────────────────────────────────────────────────────────\n')
    for (const ex of EXAMPLE_CONNECTORS) {
      process.stdout.write(
        `  ${ex.id.padEnd(12)} ${ex.label.padEnd(14)} ${ex.context.outputLanguage.padEnd(12)} ${ex.description}\n`,
      )
    }
    process.stdout.write('\nRun "mcpforge examples --id <id>" for the generate command.\n\n')
  })
