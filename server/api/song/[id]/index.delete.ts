const logger = BakaLogger.child({ service: 'SongDeleteAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const songId = getRouterParam(event, 'id');

    if (!songId || !isValidObjectIdString(songId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid song ID"
      });
    }

    logger.info(`SongDeleteAPI: Deleting song ${songId}`);

    // Check if song exists and user has permission to delete it
    const song = await Songs.findById(songId);
    if (!song) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Song not found'
      });
    }

    // Check if user is the one who added the song
    if (song.addedBy && song.addedBy.toString() !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete songs you added'
      });
    }

    // Remove song from album
    await Albums.findByIdAndUpdate(song.album, {
      $pull: { songs: { song: songId } }
    });

    // Remove song from artists
    for (const artistId of song.artists) {
      await Artists.findByIdAndUpdate(artistId, {
        $pull: { songs: { song: songId } }
      });
    }

    // Remove song from playlists
    await Playlists.updateMany(
      { 'songs.song': songId },
      { $pull: { songs: { song: songId } } }
    );

    // Delete related streams
    await Streams.deleteMany({ song: songId });

    // Delete the song
    await Songs.findByIdAndDelete(songId);

    logger.info(`SongDeleteAPI: Song ${songId} deleted successfully`);

    return {
      success: true,
      message: 'Song deleted successfully'
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('SongDeleteAPI: Delete failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Song"],
    description: "Delete a song",
    parameters: [
      { $ref: '#/components/parameters/songIdParam' }
    ],
    responses: {
      '200': {
        description: 'Song deleted successfully',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/songDeleteResponse' } } }
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
        description: 'Song not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    }
  }
});
