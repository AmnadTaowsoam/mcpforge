export interface ValidationResult {
  status: 'valid' | 'invalid'
  warnings: string[]
}

function ok(...warnings: string[]): ValidationResult {
  return { status: 'valid', warnings }
}

function fail(...warnings: string[]): ValidationResult {
  return { status: 'invalid', warnings }
}

export function validateConnectorName(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return fail('connector_name must not be empty')
  if (trimmed.length > 100) return fail('connector_name must be ≤ 100 characters')
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-_]*[a-zA-Z0-9])?$/.test(trimmed)) {
    return fail('connector_name may only contain alphanumeric characters, hyphens, and underscores')
  }
  return ok()
}

export function validateOpenApiSpec(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return fail('openapi_spec must not be empty')

  // Try JSON parse
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    // Not JSON — for T6, accept YAML-like content with a warning (full YAML parse in T11)
    if (trimmed.startsWith('openapi:') || trimmed.startsWith('swagger:')) {
      return ok('YAML content accepted without deep validation — full validation in T11')
    }
    return fail('openapi_spec must be valid JSON or start with openapi:/swagger:')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return fail('openapi_spec must be a JSON object')
  }

  const obj = parsed as Record<string, unknown>
  const hasVersion = 'openapi' in obj || 'swagger' in obj
  if (!hasVersion) {
    return fail('openapi_spec must have an "openapi" or "swagger" version field')
  }

  const warnings: string[] = []
  if (!('info' in obj)) warnings.push('Missing "info" field — recommended by OpenAPI spec')
  if (!('paths' in obj)) warnings.push('Missing "paths" field — no endpoints defined')

  return ok(...warnings)
}

export function validateDockerConfig(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return fail('docker_config must not be empty')

  // Accept Dockerfile or docker-compose JSON/YAML
  if (trimmed.startsWith('FROM ') || trimmed.startsWith('from ')) {
    return ok()
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed !== 'object' || parsed === null) {
      return fail('docker_config JSON must be an object')
    }
    return ok()
  } catch {
    // Assume it might be YAML docker-compose
    if (trimmed.includes('services:') || trimmed.includes('image:')) {
      return ok('docker-compose YAML accepted without deep validation — full validation in T11')
    }
    return fail('docker_config must be a Dockerfile, docker-compose JSON, or docker-compose YAML')
  }
}

export function validateEnvVars(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) return ok('env_vars is empty — no environment variables will be injected')

  const lines = trimmed.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))
  const invalid = lines.filter((l) => !/^[A-Z_][A-Z0-9_]*=/.test(l.trim()))
  if (invalid.length > 0) {
    return fail(`Invalid env var lines (must be KEY=value): ${invalid.slice(0, 3).join(', ')}`)
  }
  return ok()
}

export function validateInput(inputType: string, value: string): ValidationResult {
  switch (inputType) {
    case 'connector_name':
      return validateConnectorName(value)
    case 'openapi_spec':
      return validateOpenApiSpec(value)
    case 'docker_config':
      return validateDockerConfig(value)
    case 'env_vars':
      return validateEnvVars(value)
    default:
      // Generic: just require non-empty
      return value.trim()
        ? ok()
        : fail(`${inputType} must not be empty`)
  }
}
