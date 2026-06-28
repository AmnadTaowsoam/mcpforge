import type { StepContext, StepResult } from '../../types.js'

export async function validateOutputStep(ctx: StepContext): Promise<StepResult> {
  const { coreOutput } = ctx.state

  if (!coreOutput) {
    return {
      ok: false,
      error: 'execute-core-workflow step must run first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    }
  }

  const missing: string[] = []
  if (!coreOutput.server.trim()) missing.push('server')
  if (!coreOutput.readme.trim()) missing.push('readme')
  if (!coreOutput.manifest.trim()) missing.push('manifest')

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Output missing required sections: ${missing.join(', ')}`,
      code: 'OUTPUT_VALIDATION_FAILED',
      retryable: false,
    }
  }

  try {
    JSON.parse(coreOutput.manifest)
  } catch {
    return {
      ok: false,
      error: 'manifest is not valid JSON',
      code: 'MANIFEST_INVALID',
      retryable: false,
    }
  }

  ctx.log.info({ runId: ctx.data.runId }, 'output validated')
  return { ok: true }
}
