export default defineEventHandler(async (_event) => {
  // TODO: Implement user's playlists retrieval
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  })
})

defineRouteMeta({
  openAPI: {
    tags: ["Playlist"],
    description: "Get current user's playlists",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
      },
      '401': {
        description: 'Not authenticated',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
})
