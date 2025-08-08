const logger = BakaLogger.child({ service: 'PlaylistDeleteAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    const { id: playlistId } = await parseRouteParams(event, PlaylistRequestParamsInternal)

    const playlist = await checkPlaylistOwnership(event, playlistId);

    logger.info(`PlaylistDeleteAPI: Deleting playlist ${playlistId}`);

    try {
      if (playlist.coverUrl) {
        try {
          await mediaUploadService.deleteMedia(playlist.coverUrl);
        } catch (error) {
          logger.warn('PlaylistDeleteAPI: Failed to delete playlist cover image', { error });
        }
      }
      await Users.deletePlaylist(userId, playlistId);
    } catch (modelError: unknown) {
      // Handle specific errors from the Users.deletePlaylist method
      if (modelError instanceof Error && modelError.message === 'User not found') {
        logger.warn('PlaylistDeleteAPI: User not found', { userId });
        throw createError({
          statusCode: 404,
          statusMessage: 'User not found'
        });
      } else if (modelError instanceof Error && modelError.message === 'Playlist not found') {
        logger.warn('PlaylistDeleteAPI: Playlist not found', { playlistId });
        throw createError({
          statusCode: 404,
          statusMessage: 'Playlist not found'
        });
      } else if (modelError instanceof Error && modelError.message === 'Unauthorized: User does not own this playlist') {
        logger.warn('PlaylistDeleteAPI: Unauthorized delete attempt', { playlistId, userId });
        throw createError({
          statusCode: 403,
          statusMessage: 'You can only delete your own playlists'
        });
      } else {
        // Re-throw other errors to be handled by the outer catch
        throw modelError;
      }
    }

    logger.info(`PlaylistDeleteAPI: Playlist ${playlistId} deleted successfully`);

    return {
      success: true,
      message: 'Playlist deleted successfully'
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistDeleteAPI: Delete failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Playlist"],
    description: "Delete a playlist",
    parameters: [
      { $ref: '#/components/parameters/playlistIdParam' }
    ],
    responses: {
      '200': {
        description: 'Playlist deleted successfully',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PlaylistDeleteResponse' } } }
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
});
