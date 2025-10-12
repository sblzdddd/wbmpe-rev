import { H3Error } from 'h3'

const logger = BakaLogger.child({ service: 'SearchAPI' })

// Helper function to extract BV code from URL
function getBVCode(url: string): string | null {
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  return bvMatch ? bvMatch[0] : null
}

// Placeholder function for Bilibili pages - needs actual implementation
async function getBilibiliPages(_bvid: string): Promise<{ success: boolean; data: Array<{ first_frame: string; part: string; page: number }> }> {
  // This is a placeholder implementation
  // In a real implementation, you'd use bilibili-api or make direct API calls
  return {
    success: false,
    data: []
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as unknown as GetBilibiliPagesRequestType
    const { url } = query

    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameter: url'
      })
    }

    const bvid = getBVCode(url)
    if (!bvid) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid URL: ${url}`
      })
    }

    try {
      const { success, data } = await getBilibiliPages(bvid)
      
      if (!success) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to fetch Bilibili pages'
        })
      }

      const pages: BilibiliPageType[] = data.map(d => ({
        thumb: d.first_frame,
        name: d.part,
        page: d.page
      }))

      return { data: pages }
    } catch (error) {
      logger.error('Bilibili pages error:', error)
      if( !(error instanceof H3Error)) {
        throw error
      }
      throw createError({
        statusCode: 400,
        statusMessage: `Error fetching pages for URL '${url}': ${error.message || error}`
      })
    }
  } catch (error) {
    if( !(error instanceof H3Error)) {
      throw error
    }
    logger.error('Unexpected error in bilibili-pages endpoint:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    description: "Get Bilibili video pages",
    parameters: [
      { in: "query", name: "url", required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/bilibiliPagesResponse' } } }
      },
      '400': {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
    }
  }
})