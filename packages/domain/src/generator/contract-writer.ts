import type { GenerationContext } from './types.js'

export interface OpenApiSpec {
  openapi: string
  info: { title: string; version: string; description: string }
  paths: Record<string, unknown>
  components: { schemas: Record<string, unknown> }
}

export function generateContract(ctx: GenerationContext): string {
  const name = ctx.connectorName
  const nameLower = name.toLowerCase()
  const desc = ctx.description || `MCP connector for ${name}`

  const spec: OpenApiSpec = {
    openapi: '3.1.0',
    info: { title: `${name} MCP Connector`, version: '1.0.0', description: desc },
    paths: {
      [`/${nameLower}`]: {
        get: {
          operationId: `${name}_list`,
          summary: `List ${name} resources`,
          parameters: [
            { name: 'query', in: 'query', required: false, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${name}ListResponse` },
                },
              },
            },
          },
        },
      },
      [`/${nameLower}/{id}`]: {
        get: {
          operationId: `${name}_get`,
          summary: `Get a ${name} resource by ID`,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${name}Resource` },
                },
              },
            },
            '404': { description: 'Not found' },
          },
        },
      },
    },
    components: {
      schemas: {
        [`${name}Resource`]: {
          type: 'object',
          required: ['id', 'connector'],
          properties: {
            id: { type: 'string', description: 'Resource ID' },
            connector: { type: 'string', enum: [name] },
            data: { type: 'object', nullable: true, description: 'Resource payload' },
          },
        },
        [`${name}ListResponse`]: {
          type: 'object',
          required: ['connector', 'results'],
          properties: {
            connector: { type: 'string', enum: [name] },
            query: { type: 'string', nullable: true },
            results: {
              type: 'array',
              items: { $ref: `#/components/schemas/${name}Resource` },
            },
          },
        },
      },
    },
  }

  return JSON.stringify(spec, null, 2)
}
