defineEventHandler(async (_event) => {
  // TODO: Implement playlist listing
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
          PlaylistInfo: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              coverUrl: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              owner: { $ref: '#/components/schemas/SimpleUser' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          PaginatedPlaylist: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              playlistType: { type: 'string', enum: ['playlist', 'favourite', 'recent'] },
              coverUrl: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              owner: { $ref: '#/components/schemas/SimpleUser' },
              songList: { $ref: '#/components/schemas/SongList' },
              createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
              updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
            }
          },
          PlaylistResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PaginatedPlaylist' }
            }
          },
        }
      }
    },
  }
})
