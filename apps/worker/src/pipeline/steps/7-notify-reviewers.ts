import type { StepContext, StepResult } from '../../types.js'

export async function notifyReviewersStep(ctx: StepContext): Promise<StepResult> {
  const { artifacts, findings } = ctx.state

  if (!artifacts) {
    return {
      ok: false,
      error: 'package-artifacts step must run first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    }
  }

  const criticalFindings = (findings ?? []).filter(
    (f) => f.severity === 'critical' || f.severity === 'high',
  )

  ctx.log.info(
    {
      runId: ctx.data.runId,
      workspaceId: ctx.data.workspaceId,
      artifactCount: artifacts.length,
      findingCount: findings?.length ?? 0,
      criticalCount: criticalFindings.length,
      requiresManualReview: criticalFindings.length > 0,
    },
    'run complete — reviewers notified',
  )

  // In production (T11): write audit event to DB, emit webhook or in-app notification.
  // Mock mode: log only.

  return { ok: true }
}
