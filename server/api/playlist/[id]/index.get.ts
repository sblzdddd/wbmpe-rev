// get playlist by id

const logger = BakaLogger.child({service: 'PlaylistAPI'})

export default defineEventHandler(async (event) => {
  try {
    const { id: playlistId } = await parseRouteParams(event, PlaylistRequestParamsInternal)

    await checkPlaylistReadAccess(event, playlistId);

    logger.info('PlaylistAPI: Getting playlist data', {playlistId})

    // Get pagination parameters from query
    // const query = getQuery(event)
    // const page = parseInt(query.page as string) || 1
    // const limit = parseInt(query.limit as string) || 100

    const playlist = await Playlists.findFullPlaylistData(playlistId)
    
    if (!playlistId || !playlist) {
      logger.warn('PlaylistAPI: Playlist not found', {playlistId})
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      })
    }

    const songList = await createSongList(playlist.songs, 1, -1)
    
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
      { $ref: '#/components/parameters/playlistIdParam' }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/playlistResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '403': {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '404': {
        description: 'Playlist not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
})
