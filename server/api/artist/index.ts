export default defineEventHandler(async (_event) => {
  // TODO: Implement artist listing
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  })
})

defineRouteMeta({
  openAPI: {
    tags: ["Artist"],
    description: "Get all artists",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
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