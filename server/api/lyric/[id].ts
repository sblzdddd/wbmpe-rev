export default defineEventHandler(async (_event) => {
  // TODO: Implement lyric retrieval
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  })
})

defineRouteMeta({
  openAPI: {
    tags: ["Lyric"],
    description: "Get lyrics for a song",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
      },
      '404': {
        description: 'Lyrics not found',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
}) 