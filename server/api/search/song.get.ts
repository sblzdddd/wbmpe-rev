/* eslint-disable @typescript-eslint/no-explicit-any */
import { H3Error } from 'h3'

const logger = BakaLogger.child({ service: 'SearchAPI' })

// Platform weights: netease > qq > mikufans(bilibili)
const platformWeights = {
  netease: 3,
  qq: 2,
  bilibili: 1
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as { keyword?: string; page?: string }
    const { keyword, page } = query

    if (!keyword || !page) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: keyword, page'
      })
    }

    // Get stored songs from database
    const storedSongs = await Songs.find({
      name: { $regex: keyword, $options: 'i' }
    })
      .populate('artists')
      .populate('album')
      .limit(20)
      .skip((Number(page) - 1) * 20)

    try {
      // Run all three platform searches in parallel, skipping individual saves
      const [bilibiliResults, qqResults, neteaseResults] = await Promise.allSettled([
        searchSongBilibili(keyword, Number(page)),
        searchSongQQ(keyword, Number(page)),
        searchSongNetease(keyword, Number(page))
      ])

      // Collect all unparsed songs from successful searches
      const allUnparsedSongs: UnparsedSongWithoutId[] = []
      let totalPages = 1

      if (bilibiliResults.status === 'fulfilled' && bilibiliResults.value.results) {
        allUnparsedSongs.push(...bilibiliResults.value.results)
        totalPages = Math.max(totalPages, bilibiliResults.value.totalPage)
      }

      if (qqResults.status === 'fulfilled' && qqResults.value.results) {
        allUnparsedSongs.push(...qqResults.value.results)
        totalPages = Math.max(totalPages, qqResults.value.totalPage)
      }

      if (neteaseResults.status === 'fulfilled' && neteaseResults.value.results) {
        allUnparsedSongs.push(...neteaseResults.value.results)
        totalPages = Math.max(totalPages, neteaseResults.value.totalPage)
      }

      // Process unparsed songs only once
      const processedSongs = allUnparsedSongs.length > 0 ? await UnparsedSongs.addSongs(allUnparsedSongs) : []

      // Sort by relevance and platform weight
      const sortedResults = processedSongs.sort((a, b) => {
        // Calculate relevance scores
        const aRelevance = calculateSimilarity(a.name, keyword)
        const bRelevance = calculateSimilarity(b.name, keyword)
        
        // Calculate platform scores
        const aPlatformWeight = platformWeights[a.platform as keyof typeof platformWeights] || 0
        const bPlatformWeight = platformWeights[b.platform as keyof typeof platformWeights] || 0
        
        // Sort by relevance first (descending), then by platform weight (descending)
        if (Math.abs(aRelevance - bRelevance) > 0.1) {
          return bRelevance - aRelevance
        }
        return bPlatformWeight - aPlatformWeight
      })

      return {
        page: Number(page),
        totalPage: totalPages,
        results: sortedResults,
        stored_songs: storedSongs as unknown as SongType[]
      }
    } catch (error: any) {
      logger.error('Search error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: `Error searching '${keyword}': ${error.message}`
      })
    }
  } catch (error: any) {
    if( !(error instanceof H3Error)) {
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
    description: "Search for songs across all platforms (bilibili, qq, netease) in parallel",
    parameters: [
      { in: "query", name: "keyword", required: true, schema: { type: 'string' } },
      { in: "query", name: "page", required: true, schema: { type: 'number' } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                page: { type: 'number' },
                totalPage: { type: 'number' },
                results: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SearchResult' }
                },
                stored_songs: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SongItem' }
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
    },
    $global: {
      components: {
        schemas: {
          SearchResult: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              src: { type: 'string' },
              name: { type: 'string' },
              artistNames: { type: 'string' },
              artists: { type: 'array', items: { type: 'object' } },
              album: { type: 'string' },
              pic: { type: 'string' },
              duration: { type: 'number' },
              addedTime: { type: 'number' }
            }
          }
        }
      }
    }
  }
})