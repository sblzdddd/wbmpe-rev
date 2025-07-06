export default defineEventHandler(async (_event) => {
  // TODO: Implement user's playlists retrieval
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
          PlaylistList: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              page: { type: 'number' },
              max_page: { type: 'number' },
              playlists: { type: 'array', items: { $ref: '#/components/schemas/PlaylistInfo' } }
            }
          },
          MyPlaylistsResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/PlaylistList' }
            }
          },
        }
      }
    },
    tags: ["Playlist"],
    description: "Get current user's playlists",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/MyPlaylistsResponse' } } }
      },
      '401': {
        description: 'Not authenticated',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})
