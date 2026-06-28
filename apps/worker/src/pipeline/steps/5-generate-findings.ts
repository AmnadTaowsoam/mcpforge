import type { StepContext, StepResult, GeneratedFinding } from '../../types.js'

export async function generateFindingsStep(ctx: StepContext): Promise<StepResult> {
  const { coreOutput, context } = ctx.state

  if (!coreOutput || !context) {
    return {
      ok: false,
      error: 'earlier pipeline steps must complete first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    }
  }

  const findings: GeneratedFinding[] = []

  // Static checks: missing tests
  if (!coreOutput.tests.trim() || coreOutput.tests.includes('TODO')) {
    findings.push({
      severity: 'medium',
      category: 'correctness',
      title: 'Test stub not implemented',
      body: 'Generated test file contains TODO stubs. Implement tests before shipping.',
      suggestedFix: 'Add vitest tests covering each exported tool function.',
    })
  }

  // Check for hardcoded secrets pattern (naive scan)
  if (/password|secret|apikey/i.test(coreOutput.server)) {
    findings.push({
      severity: 'high',
      category: 'security',
      title: 'Possible hardcoded credential in server code',
      body: 'Pattern matching suggests a credential may be hardcoded. Review before publishing.',
      suggestedFix: 'Use environment variables for all credentials.',
    })
  }

  // Advisory: always include this
  findings.push({
    severity: 'info',
    category: 'advisory',
    title: 'Review generated code before publishing',
    body: 'Generated code is a starting point. Review tool descriptions, error handling, and auth flows.',
  })

  ctx.log.info(
    { runId: ctx.data.runId, findingCount: findings.length },
    'findings generated',
  )

  return { ok: true, updates: { findings } }
}
