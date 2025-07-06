export default defineEventHandler(async (_event) => {
  // TODO: Implement song listing
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
          SimpleAlbum: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              coverUrl: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          Song: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              src: { type: 'string' },
              name: { type: 'string' },
              artists: { type: 'array', items: { $ref: '#/components/schemas/SimpleArtist' } },
              album: { $ref: '#/components/schemas/SimpleAlbum' },
              duration: { type: 'number' },
              isFavourite: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          SongList: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              page: { type: 'number' },
              max_page: { type: 'number' },
              songs: { type: 'array', items: { type: 'object', properties: {
                _id: { type: 'string' },
                song: { $ref: '#/components/schemas/Song' },
                createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
                updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
              } } }
            }
          },
          SongResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/SongList' }
            }
          },
        }
      }
    },
    tags: ["Song"],
    description: "Get all songs",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SongResponse' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 