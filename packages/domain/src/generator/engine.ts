import { render } from './template-engine.js'
import { getTemplate } from './template-registry.js'
import type { GenerationContext, RenderedOutput, TemplateVars } from './types.js'

export class GeneratorEngine {
  generate(ctx: GenerationContext): RenderedOutput {
    const template = getTemplate(ctx.connectorType, ctx.outputLanguage)
    const vars = buildVars(ctx)

    let manifest: string
    try {
      manifest = JSON.stringify(JSON.parse(render(template.manifestTemplate, vars)), null, 2)
    } catch {
      manifest = render(template.manifestTemplate, vars)
    }

    return {
      server: render(template.server, vars),
      readme: render(template.readme, vars),
      tests: render(template.tests, vars),
      dockerFile: render(template.dockerfile, vars),
      manifest,
    }
  }
}

function buildVars(ctx: GenerationContext): Record<string, string> {
  const vars: TemplateVars = {
    connectorName: ctx.connectorName,
    connectorNameLower: ctx.connectorName.toLowerCase(),
    connectorNameUpper: ctx.connectorName.toUpperCase(),
    connectorType: ctx.connectorType,
    description: ctx.description || `MCP server for ${ctx.connectorName}`,
    outputLanguage: ctx.outputLanguage,
    generatedAt: new Date().toISOString(),
    featuresComment:
      ctx.features.length > 0
        ? `// Features: ${ctx.features.join(', ')}`
        : '// No additional features configured',
  }
  return vars as unknown as Record<string, string>
}
