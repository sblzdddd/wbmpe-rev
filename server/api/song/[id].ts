// const logger = BakaLogger.child({service: 'SongAPI'})

export default defineEventHandler(async (_event) => {
  // TODO: Implement song retrieval by ID
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  })
})

defineRouteMeta({
  openAPI: {
    tags: ["Song"],
    description: "Get a song by ID",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
      },
      '404': {
        description: 'Song not found',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
});