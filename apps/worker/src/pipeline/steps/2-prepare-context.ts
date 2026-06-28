import type { StepContext, StepResult } from '../../types.js'

export async function prepareContextStep(ctx: StepContext): Promise<StepResult> {
  const { validatedInputs } = ctx.state

  if (!validatedInputs) {
    return {
      ok: false,
      error: 'validate-inputs step must run first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    }
  }

  // In mock/dev mode: use stub workspace + project data.
  // In production: query DB for workspace + project records.
  const context = {
    workspace: { id: ctx.data.workspaceId, name: 'workspace' },
    project: { id: ctx.data.projectId, name: 'project' },
    config: ctx.data.config,
    inputs: validatedInputs.inputs,
  }

  ctx.log.info(
    { runId: ctx.data.runId, connectorName: validatedInputs.connectorName },
    'generation context prepared',
  )

  return { ok: true, updates: { context } }
}
