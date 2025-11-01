const logger = BakaLogger.child({ service: 'AlbumAPI' });

export default defineEventHandler(async (event) => {
  try {
    const { id: albumId } = await parseRouteParams(event, albumRequestParamsInternal);

    await checkAlbumReadAccess(event, albumId);

    logger.info('AlbumAPI: Getting album data', { albumId });

    const album = await Albums.findFullAlbumData(albumId);
    
    if (!album) {
      logger.warn('AlbumAPI: Album not found', { albumId });
      throw createError({
        statusCode: 404,
        statusMessage: 'Album not found'
      });
    }

    const songList = await createSongList(album.songs, 1, -1);
    
    return {
      data: {
        ...album,
        songs: undefined,
        songList
      } as unknown as PaginatedAlbum
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }
    logger.error('AlbumAPI: Server Error getting album data', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Album"],
    description: "Get an album by ID",
    parameters: [
      { $ref: '#/components/parameters/albumIdParam' }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/albumResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '404': {
        description: 'Album not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    }
  }
}) 