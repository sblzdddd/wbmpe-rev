/* eslint-disable @typescript-eslint/no-explicit-any */
import { H3Error } from 'h3'

const logger = BakaLogger.child({ service: 'SearchAPI' })

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const result = await searchSongRequest.safeParse(query)
    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.issues.map((e) => e.message).join('; ')})
    }
    const { keyword } = result.data

    // Get stored songs from database
    const storedSongs = await Songs.searchMultipleFullInfo(keyword)

    return {
      totalPage: 0,
      results: storedSongs as unknown as SongType[],
    }
  } catch (error: any) {
    if(error instanceof H3Error) {
      throw error
    }
    logger.error('Unexpected error in search endpoint:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    description: "Search for songs in library by keyword.",
    parameters: [
      { in: "query", name: "keyword", required: true, schema: { type: 'string' } },
      { in: "query", name: "page", required: true, schema: { type: 'number' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/searchSongResponse' } } }
      },
      '400': {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
    },
  }
})