import { generationJobDataSchema } from '../../types.js'
import type { StepContext, StepResult } from '../../types.js'

export async function validateInputsStep(ctx: StepContext): Promise<StepResult> {
  const parse = generationJobDataSchema.safeParse(ctx.data)

  if (!parse.success) {
    const detail = parse.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return {
      ok: false,
      error: `Invalid job data: ${detail}`,
      code: 'VALIDATION_FAILED',
      retryable: false,
    }
  }

  const { connectorName, connectorType, description } = parse.data.config

  return {
    ok: true,
    updates: {
      validatedInputs: {
        connectorName,
        connectorType,
        description: description ?? '',
        inputs: parse.data.inputs,
      },
    },
  }
}
