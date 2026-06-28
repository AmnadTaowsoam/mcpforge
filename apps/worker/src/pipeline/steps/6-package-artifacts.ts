import { createHash } from 'node:crypto'
import type { StepContext, StepResult, PackagedArtifact } from '../../types.js'

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export async function packageArtifactsStep(ctx: StepContext): Promise<StepResult> {
  const { coreOutput, context } = ctx.state

  if (!coreOutput || !context) {
    return {
      ok: false,
      error: 'earlier pipeline steps must complete first',
      code: 'STEP_ORDER_VIOLATION',
      retryable: false,
    }
  }

  const connectorName = context.config.connectorName.toLowerCase().replace(/\s+/g, '-')

  const rawArtifacts = [
    { artifactType: 'server', path: `${connectorName}/src/index.ts`, content: coreOutput.server },
    { artifactType: 'readme', path: `${connectorName}/README.md`, content: coreOutput.readme },
    { artifactType: 'tests', path: `${connectorName}/src/index.test.ts`, content: coreOutput.tests },
    { artifactType: 'dockerfile', path: `${connectorName}/Dockerfile`, content: coreOutput.dockerFile },
    { artifactType: 'manifest', path: `${connectorName}/mcp.json`, content: coreOutput.manifest },
  ]

  const artifacts: PackagedArtifact[] = rawArtifacts.map((a) => ({
    ...a,
    checksum: sha256(a.content),
  }))

  // In production (T11): upload to object storage (MinIO/S3) and record in DB.
  // In mock mode: in-memory only, content_ref would be the storage path.
  ctx.log.info(
    { runId: ctx.data.runId, artifactCount: artifacts.length },
    'artifacts packaged',
  )

  return { ok: true, updates: { artifacts } }
}
