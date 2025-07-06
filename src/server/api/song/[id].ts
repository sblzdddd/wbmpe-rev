// import type { Song } from '~/types/Song'
// import BakaLogger from '~/server/utils/BakaLogger'
// import { isValidObjectIdString } from '~/server/utils/IdValidator'
// import Songs from '~/server/models/Songs';

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
          SongItem: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              song: { $ref: '#/components/schemas/Song' },
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
              songs: { type: 'array', items: { $ref: '#/components/schemas/SongItem' } }
            }
          },
          SongResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/Song' }
            }
          },
        }
      }
    },
    tags: ["Song"],
    description: "Get a song by ID",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SongResponse' } } }
      },
      '404': {
        description: 'Song not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
});