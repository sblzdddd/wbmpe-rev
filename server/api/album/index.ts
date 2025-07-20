export default defineEventHandler(async (_event) => {
  // TODO: Implement album listing
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
          AlbumData: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              artists: { type: 'array', items: { $ref: '#/components/schemas/SimpleArtist' } },
              coverUrl: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              songList: { $ref: '#/components/schemas/SongList' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          AlbumResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/AlbumData' }
            }
          },
        }
      }
    },
    tags: ["Album"],
    description: "Get all albums",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AlbumResponse' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 