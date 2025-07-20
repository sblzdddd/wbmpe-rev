export default defineEventHandler(async (_event) => {
  // TODO: Implement artist listing
  throw createError({
    statusCode: 501,
    statusMessage: 'Not implemented'
  })
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          SimpleArtist: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          Artist: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              avatarUrl: { type: 'string' },
              songList: { $ref: '#/components/schemas/SongList' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          ArtistList: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              page: { type: 'number' },
              max_page: { type: 'number' },
              artists: { type: 'array', items: { $ref: '#/components/schemas/Artist' } }
            }
          },
          ArtistResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ArtistList' }
            }
          },
        }
      }
    },
    tags: ["Artist"],
    description: "Get all artists",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ArtistResponse' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 