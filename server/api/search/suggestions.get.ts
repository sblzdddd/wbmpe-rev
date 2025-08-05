import { H3Error } from 'h3'

const logger = BakaLogger.child({ service: 'SearchAPI' })

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as unknown as GetSuggestionsRequestType
    const { keyword } = query

    if (!keyword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: keyword'
      })
    }

    try {
      const suggestions = await QQSearch.getSuggestions(keyword)
      return { suggestions }
    } catch (error) {
      logger.error('Suggestions error:', error)
      if( !(error instanceof H3Error)) {
        throw error
      }
      throw createError({
        statusCode: 400,
        statusMessage: `Error getting suggestions for '${keyword}': ${error.message || error}`
      })
    }
  } catch (error) {
    if( !(error instanceof H3Error)) {
      throw error
    }
    logger.error('Unexpected error in suggestions endpoint:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    description: "Get search suggestions for keywords",
    parameters: [
      { in: "query", name: "keyword", required: true, schema: { type: 'string' } },
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad request',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
})