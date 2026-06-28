export interface GenerationContext {
  connectorName: string
  connectorType: string
  description: string
  features: string[]
  outputLanguage: 'typescript' | 'python'
  aiProvider: string
  aiModel: string
}

export interface TemplateVars {
  connectorName: string
  connectorNameLower: string
  connectorNameUpper: string
  connectorType: string
  description: string
  outputLanguage: string
  generatedAt: string
  featuresComment: string
}

export interface TemplateSet {
  server: string
  readme: string
  tests: string
  dockerfile: string
  manifestTemplate: string
}

export interface RenderedOutput {
  server: string
  readme: string
  tests: string
  dockerFile: string
  manifest: string
}
