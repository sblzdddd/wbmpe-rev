import type { PaginatedPlaylist } from '~/types/Playlist/index'
import Playlists from "~/server/models/Playlists";
import { createSongList } from '~/server/utils/paginate'
import BakaLogger from '~/server/utils/BakaLogger'
import { isValidObjectIdString } from '~/server/utils/IdValidator'

const logger = BakaLogger.child({service: 'PlaylistAPI'})

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const playlistId = id as string
    if (!isValidObjectIdString(playlistId)) {
      logger.warn('PlaylistAPI: Invalid playlist ID', {playlistId})
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      })
    }
    logger.info('PlaylistAPI: Getting playlist data', {playlistId})

    // Get pagination parameters from query
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 100

    const playlist = await Playlists.findFullPlaylistData(playlistId)
    
    if (!playlistId || !playlist) {
      logger.warn('PlaylistAPI: Playlist not found', {playlistId})
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      })
    }

    const songList = await createSongList(playlist.songs, page, limit)
    
    return {
      data: {
        ...playlist,
        songs: undefined,
        songList
      } as unknown as PaginatedPlaylist
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }
    logger.error('PlaylistAPI: Server Error getting playlist data', {error})
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
  

defineRouteMeta({
  openAPI: {
    tags: ["Playlist"],
    description: "Get a playlist by ID",
    parameters: [
      { in: "path", name: "id", required: true, schema: { type: 'string' } },
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PlaylistResponse' } } }
      },
      '404': {
        description: 'Playlist not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})
