#!/usr/bin/env node
import { Command } from 'commander'
import { generateCommand } from './commands/generate.js'
import { validateCommand } from './commands/validate.js'
import { listTemplatesCommand } from './commands/list-templates.js'
import { packCommand } from './commands/pack.js'
import { examplesCommand } from './commands/examples.js'

const program = new Command()
  .name('mcpforge')
  .description('MCPForge CLI — generate production-grade MCP servers')
  .version('0.1.0')

program.addCommand(generateCommand)
program.addCommand(validateCommand)
program.addCommand(listTemplatesCommand)
program.addCommand(packCommand)
program.addCommand(examplesCommand)

program.parse()
