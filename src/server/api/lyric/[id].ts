export default defineEventHandler(async (_event) => {
  // TODO: Implement lyric retrieval
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
          Lyric: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              content: { type: 'string' },
              lang: { type: 'string' },
              ext: { type: 'string' }
            }
          },
          LyricLine: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              start: { type: 'number' },
              end: { type: 'number' },
              alt: { type: 'string' }
            }
          },
          ParsedLyric: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              lyric: { $ref: '#/components/schemas/Lyric' },
              lines: { type: 'array', items: { $ref: '#/components/schemas/LyricLine' } },
              ext: { type: 'string' }
            }
          },
          LyricResponse: {
            type: 'object',
            properties: {
              data: { $ref: '#/components/schemas/ParsedLyric' }
            }
          },
        }
      }
    },
    tags: ["Lyric"],
    description: "Get lyrics for a song",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LyricResponse' } } }
      },
      '404': {
        description: 'Lyrics not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 