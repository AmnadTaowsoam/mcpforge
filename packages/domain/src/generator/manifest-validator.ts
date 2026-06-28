export interface ManifestValidationResult {
  valid: boolean
  errors: string[]
}

const REQUIRED_FIELDS = ['name', 'version', 'mcpVersion', 'tools'] as const

export function validateManifest(manifestJson: string): ManifestValidationResult {
  const errors: string[] = []

  let parsed: unknown
  try {
    parsed = JSON.parse(manifestJson)
  } catch {
    return { valid: false, errors: ['Manifest is not valid JSON'] }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, errors: ['Manifest must be a JSON object'] }
  }

  const obj = parsed as Record<string, unknown>

  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) errors.push(`Missing required field: ${field}`)
  }

  if ('tools' in obj && !Array.isArray(obj['tools'])) {
    errors.push('Field "tools" must be an array')
  }

  if ('version' in obj && typeof obj['version'] !== 'string') {
    errors.push('Field "version" must be a string')
  }

  return { valid: errors.length === 0, errors }
}
