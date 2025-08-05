export default defineEventHandler(async (_event) => {
  // TODO: Implement song listing
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  })
})

defineRouteMeta({
  openAPI: {
    tags: ["Song"],
    description: "Get all songs",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
}) 