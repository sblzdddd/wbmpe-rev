const logger = BakaLogger.child({ service: 'AlbumDeleteAPI' });

export default defineEventHandler(async (event) => {
  try {
    const { id: albumId } = await parseRouteParams(event, albumRequestParamsInternal);
    const album = await checkAlbumExists(albumId);

    await checkAlbumEditAccess(event, albumId);

    logger.info(`AlbumDeleteAPI: Deleting album ${albumId}`);

    try {
      if (album.coverUrl) {
        try {
          await mediaUploadService.deleteMedia(album.coverUrl);
        } catch (error) {
          logger.warn('AlbumDeleteAPI: Failed to delete album cover image', { error });
        }
      }
      
      await Albums.deleteAlbum(albumId);
    } catch (modelError: unknown) {
      if (modelError instanceof Error && modelError.message === 'Album not found') {
        logger.warn('AlbumDeleteAPI: Album not found', { albumId });
        throw createError({
          statusCode: 404,
          statusMessage: 'Album not found'
        });
      } else {
        throw modelError;
      }
    }

    logger.info(`AlbumDeleteAPI: Album ${albumId} deleted successfully`);

    return {
      success: true,
      message: 'Album deleted successfully'
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('AlbumDeleteAPI: Delete failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Album"],
    description: "Delete an album",
    parameters: [
      { $ref: '#/components/parameters/albumIdParam' }
    ],
    responses: {
      '200': {
        description: 'Album deleted successfully',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/albumDeleteResponse' } } }
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
        description: 'Album not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    }
  }
});
