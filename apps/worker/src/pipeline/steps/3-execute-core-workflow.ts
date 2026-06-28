import { GeneratorEngine } from '@mcpforge/domain'
import type { StepContext, StepResult, CoreWorkflowOutput } from '../../types.js'

const engine = new GeneratorEngine()

export async function executeCoreWorkflowStep(ctx: StepContext): Promise<StepResult> {
  const { context } = ctx.state

  if (!context) {
    return {
      ok: false,
      error: 'prepare-context step must run first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    }
  }

  const { connectorName, connectorType, description, features, outputLanguage, aiProvider } =
    context.config

  const rendered = engine.generate({
    connectorName,
    connectorType,
    description: description ?? '',
    features,
    outputLanguage,
    aiProvider,
    aiModel: context.config.aiModel,
  })

  const coreOutput: CoreWorkflowOutput = {
    server: rendered.server,
    readme: rendered.readme,
    tests: rendered.tests,
    dockerFile: rendered.dockerFile,
    manifest: rendered.manifest,
    packageJson: rendered.packageJson,
    tsconfig: rendered.tsconfig,
  }

  ctx.log.info(
    { runId: ctx.data.runId, provider: aiProvider, connectorType, outputLanguage },
    'core workflow executed',
  )

  return { ok: true, updates: { coreOutput } }
}
