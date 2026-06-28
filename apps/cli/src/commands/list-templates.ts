import { Command } from 'commander'

interface TemplateEntry {
  connectorType: string
  languages: readonly string[]
  description: string
}

const TEMPLATES: readonly TemplateEntry[] = [
  { connectorType: 'REST', languages: ['typescript', 'python'], description: 'HTTP REST APIs (JSON over HTTP)' },
  { connectorType: 'GraphQL', languages: ['typescript', 'python'], description: 'GraphQL query and mutation endpoints' },
  { connectorType: 'gRPC', languages: ['typescript'], description: 'gRPC protocol buffer services' },
]

export const listTemplatesCommand = new Command('list-templates')
  .description('List available connector type and language templates')
  .action(() => {
    process.stdout.write('Available MCPForge templates:\n\n')
    process.stdout.write('  TYPE         LANGUAGES            DESCRIPTION\n')
    process.stdout.write('  ─────────────────────────────────────────────────────────\n')
    for (const t of TEMPLATES) {
      const langs = t.languages.join(', ')
      process.stdout.write(
        `  ${t.connectorType.padEnd(12)} ${langs.padEnd(20)} ${t.description}\n`,
      )
    }
    process.stdout.write('\nUsage:\n')
    process.stdout.write('  mcpforge generate --name <Name> --type REST --lang typescript\n\n')
  })
