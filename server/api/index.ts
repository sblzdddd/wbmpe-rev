
export default defineEventHandler(() => {
  // TODO: Implement index page data
  return {
    status: 'ok',
    version: '1.0.0'
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["API"],
    description: "Get API status and version",
    responses: {
      '200': {
        description: 'API status',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/apiIndexResponse' } } }
      }
    }
  }
})