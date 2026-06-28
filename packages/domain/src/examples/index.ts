import type { GenerationContext } from '../generator/types.js'

export interface ExampleConnector {
  id: string
  label: string
  description: string
  tags: string[]
  context: GenerationContext
}

export const EXAMPLE_CONNECTORS: readonly ExampleConnector[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    description: 'Payment processing — charges, customers, subscriptions',
    tags: ['payments', 'saas', 'rest'],
    context: {
      connectorName: 'Stripe',
      connectorType: 'REST',
      description: 'Stripe payment processing connector for MCP',
      features: ['pagination', 'webhooks'],
      outputLanguage: 'typescript',
      aiProvider: 'mock',
      aiModel: 'mock',
    },
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'Source control — repos, issues, pull requests, actions',
    tags: ['devtools', 'git', 'rest'],
    context: {
      connectorName: 'GitHub',
      connectorType: 'REST',
      description: 'GitHub API connector — repos, issues, pull requests',
      features: ['pagination', 'rate-limiting'],
      outputLanguage: 'typescript',
      aiProvider: 'mock',
      aiModel: 'mock',
    },
  },
  {
    id: 'slack',
    label: 'Slack',
    description: 'Team messaging — channels, messages, users',
    tags: ['communication', 'rest'],
    context: {
      connectorName: 'Slack',
      connectorType: 'REST',
      description: 'Slack messaging connector for MCP agents',
      features: ['webhooks'],
      outputLanguage: 'typescript',
      aiProvider: 'mock',
      aiModel: 'mock',
    },
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'AI APIs — completions, embeddings, fine-tuning',
    tags: ['ai', 'llm', 'rest'],
    context: {
      connectorName: 'OpenAI',
      connectorType: 'REST',
      description: 'OpenAI API connector — completions and embeddings',
      features: ['streaming'],
      outputLanguage: 'python',
      aiProvider: 'mock',
      aiModel: 'mock',
    },
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    description: 'Database queries via GraphQL introspection',
    tags: ['database', 'graphql'],
    context: {
      connectorName: 'Postgres',
      connectorType: 'GraphQL',
      description: 'PostgreSQL database connector via GraphQL bridge',
      features: ['pagination', 'filtering'],
      outputLanguage: 'typescript',
      aiProvider: 'mock',
      aiModel: 'mock',
    },
  },
]

export function findExample(id: string): ExampleConnector | undefined {
  return EXAMPLE_CONNECTORS.find((e) => e.id === id)
}
