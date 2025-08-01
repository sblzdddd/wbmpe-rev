import { QQSearch } from '../../utils/search'
import type { GetSuggestionsRequest } from '../../../types/Search/SearchData'

const logger = BakaLogger.child({ service: 'SearchAPI' })

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as unknown as GetSuggestionsRequest
    const { keyword, platform } = query

    if (!keyword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: keyword'
      })
    }

    try {
      const suggestions = await QQSearch.getSuggestions(keyword)
      return { suggestions }
    } catch (error: any) {
      logger.error('Suggestions error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: `Error searching '${keyword}' in platform '${platform}': ${error.message}`
      })
    }
  } catch (error: any) {
    if (error.statusCode) {
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
      { in: "query", name: "platform", required: false, schema: { type: 'string' } }
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})