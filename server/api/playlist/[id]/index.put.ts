// update playlist by id

const logger = BakaLogger.child({ service: 'PlaylistUpdateAPI' });

export default defineEventHandler(async (event) => {
  try {
    const { id: playlistId } = await parseRouteParams(event, PlaylistRequestParamsInternal)

    logger.info(`PlaylistUpdateAPI: Updating playlist ${playlistId}`);

    const playlist = await checkPlaylistOwnership(event, playlistId);

    const result = await readValidatedBody(event, PlaylistInfoUpdateRequest.safeParse);
    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.message});
    }
    const { name, description, coverUrl, isPublic } = result.data;

    // Build update data with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Only update name if provided
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Only update description if provided
    if (description !== undefined) {
      updateData.description = description || '';
    }

    // Only update isPublic if provided
    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
    }

    // Handle cover URL update
    if (coverUrl !== undefined) {
      // If coverUrl is empty string, remove the cover
      if (coverUrl === '' && playlist.coverUrl) {
        await mediaUploadService.deleteMedia(playlist.coverUrl);
      }
      updateData.coverUrl = coverUrl;
    }

    // Update the playlist
    const updatedPlaylist = await Playlists.findByIdAndUpdate(
      playlistId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPlaylist) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update playlist'
      });
    }

    logger.info(`PlaylistUpdateAPI: Playlist ${playlistId} updated successfully`);

    return {
      success: true,
      data: {
        _id: updatedPlaylist._id,
        name: updatedPlaylist.name,
        description: updatedPlaylist.description,
        coverUrl: updatedPlaylist.coverUrl,
        isPublic: updatedPlaylist.isPublic
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistUpdateAPI: Update failed', { error });
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
    description: "Update a playlist's metadata (partial updates supported)",
    parameters: [
      { $ref: '#/components/parameters/playlistIdParam' }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/PlaylistInfoUpdateRequest' }
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful update',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PlaylistUpdateResponse' } } }
      },
      '400': {
        description: 'Bad request',
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
    }
  }
}); 