/* eslint-disable @typescript-eslint/no-explicit-any */
import Songs from '../../models/Songs'
import type { SearchSongRequest } from '#types/Search/SearchData'

const logger = BakaLogger.child({ service: 'SearchAPI' })

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as unknown as SearchSongRequest
    const { platform, keyword, page } = query

    if (!platform || !keyword || !page) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters: platform, keyword, page'
      })
    }

    if (!['bilibili', 'qq', 'netease'].includes(platform)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Error: Platform not supported'
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

    let searchResults
    try {
      switch (platform) {
        case "bilibili":
          searchResults = await searchSongBilibili(keyword, Number(page))
          break
        case "qq":
          searchResults = await searchSongQQ(keyword, Number(page))
          break
        case "netease":
          searchResults = await searchSongNetease(keyword, Number(page))
          break
        default:
          throw createError({
            statusCode: 400,
            statusMessage: 'Error: Platform not supported'
          })
      }

      // Add stored songs to the response
      // const storedSongsList = createSongList(storedSongs.map(song => ({
      //   _id: song._id.toString(),
      //   song: {
      //     _id: song._id.toString(),
      //     src: song.src,
      //     name: song.name,
      //     artists: song.artists,
      //     album: song.album,
      //     duration: song.duration,
      //     createdAt: song.createdAt,
      //     updatedAt: song.updatedAt
      //   },
      //   createdAt: song.createdAt,
      //   updatedAt: song.updatedAt
      // })), Number(page), 20)

      return {
        ...searchResults,
        stored_songs: storedSongs
      }
    } catch (error: any) {
      logger.error('Search error:', error)
      throw createError({
        statusCode: 400,
        statusMessage: `Error searching '${keyword}' in platform '${platform}': ${error.message}`
      })
    }
  } catch (error: any) {
    if (error.statusCode) {
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
    description: "Search for songs across different platforms",
    parameters: [
      { in: "query", name: "platform", required: true, schema: { type: 'string', enum: ['bilibili', 'qq', 'netease'] } },
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