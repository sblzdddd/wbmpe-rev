
export default defineEventHandler(() => {
  // TODO: Implement index page data
  return {
    status: 'ok',
    version: '1.0.0'
  }
})


defineRouteMeta({
  openAPI: {
    description: "Get server status",
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/IndexResponse' }
          }
        }
      }
    },
    $global: {
      components: {
        schemas: {
          IndexResponse: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              version: { type: 'string' }
            }
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'boolean' },
              url: { type: 'string' },
              statusCode: { type: 'number' },
              statusMessage: { type: 'string' },
              message: { type: 'string' },
              stack: { type: 'array', items: { type: 'string' } }
            }
          },
          TimeMetadata: {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
        }
      },
    }
  }
})
