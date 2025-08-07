const logger = BakaLogger.child({ service: 'PlaylistCoverAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;

    const { id: playlistId } = await parseRouteParams(event, PlaylistRequestParamsInternal)

    logger.info('PlaylistCoverAPI: Uploading playlist cover', { playlistId, userId });

    const playlist = await checkPlaylistOwnership(event, playlistId);

    // Parse multipart form data
    const form = await readMultipartFormData(event);
    const result = PlaylistCoverUpdateRequest.safeParse({cover: form?.find(item => item.name === 'cover')});
    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.message, data: result.error.issues});
    }
    const { cover } = result.data;

    // Find image file in form data
    const imageFile = cover;
    if (!imageFile || !imageFile.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No cover image file provided'
      });
    }

    // Validate file type and size
    const filename = imageFile.filename || 'cover.jpg';
    const filenameWithoutExtension = filename.split('.').slice(0, -1).join('.');
    const extension = filename.split('.').pop();
    const buffer = imageFile.data;

    // Delete old cover if it exists
    if (playlist.coverUrl) {
      logger.info('PlaylistCoverAPI: Old cover URL found');
      await imageUploadService.deleteImage(playlist.coverUrl);
    }

    // Upload new cover to OSS
    const uploadResult = await imageUploadService.uploadPlaylistCover(
      buffer, 
      `${filenameWithoutExtension}-${makeid(10)}.${extension}`, 
      playlistId.toString()
    );

    // Update playlist with new cover URL
    const updatedPlaylist = await Playlists.findByIdAndUpdate(
      playlistId,
      { coverUrl: uploadResult.url },
      { new: true, runValidators: true }
    );

    if (!updatedPlaylist) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update playlist cover'
      });
    }

    logger.info('PlaylistCoverAPI: Cover uploaded successfully', { 
      playlistId, 
      userId,
      filename: uploadResult.name,
      coverUrl: uploadResult.url
    });

    return {
      success: true,
      data: {
        coverUrl: uploadResult.url,
        path: uploadResult.path,
        name: uploadResult.name
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistCoverAPI: Upload failed', { error });
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
    description: "Upload a cover image for a playlist",
    parameters: [
      { $ref: '#/components/parameters/playlistIdParam' }
    ],
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              cover: {
                type: 'string',
                format: 'binary',
                description: 'Cover image file'
              }
            },
            required: ['cover']
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful upload',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/playlistCoverUploadResponse' } } }
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
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
}); 