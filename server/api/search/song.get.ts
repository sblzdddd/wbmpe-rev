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
    const query = getQuery(event)
    const result = await searchSongRequest.safeParse(query)
    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.issues.map((e) => e.message).join('; ')})
    }
    const { keyword, page } = result.data

    // Get stored songs from database
    let storedSongs: SongType[] = []
    if(page === 1) {
      storedSongs = await Songs.searchMultipleFullInfo(keyword)
    }

    try {
      // Run all three platform searches in parallel, skipping individual saves
      const platformResults = await Promise.allSettled([
        searchSongBilibili(keyword, Number(page)),
        searchSongQQ(keyword, Number(page)),
        searchSongNetease(keyword, Number(page))
      ])

      // Collect all unparsed songs from successful searches
      const allUnparsedSongs: UnparsedSongWithoutId[] = []
      let totalPages = 1
      
      let i = 0;
      for (const result of platformResults) {
        i++
        if (result.status === 'fulfilled' && result.value.results) {
          logger.debug(`Successfully searched ${result.value.results.length} songs in platform ${i}`)
          allUnparsedSongs.push(...result.value.results)
          totalPages = Math.max(totalPages, result.value.totalPage)
        } else {
          logger.warn(`Failed to search ${result.status} in platform ${i}`, {result: result})
        }
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
    description: "Search for songs across all platforms (bilibili, qq, netease) in parallel",
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