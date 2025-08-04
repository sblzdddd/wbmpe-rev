const logger = BakaLogger.child({ service: 'PlaylistCoverAPI' });

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const id = getRouterParam(event, 'id');
    const playlistId = id as string;

    if (!isValidObjectIdString(playlistId)) {
      logger.warn('PlaylistCoverAPI: Invalid playlist ID', { playlistId });
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      });
    }

    logger.info('PlaylistCoverAPI: Uploading playlist cover', { playlistId, userId });

    // Find playlist and verify ownership
    const playlist = await Playlists.findById(playlistId);
    if (!playlist) {
      logger.warn('PlaylistCoverAPI: Playlist not found', { playlistId });
      throw createError({
        statusCode: 404,
        statusMessage: 'Playlist not found'
      });
    }

    // Check ownership
    if (playlist.owner?.toString() !== userId) {
      logger.warn('PlaylistCoverAPI: Unauthorized access attempt', { 
        playlistId, 
        userId, 
        ownerId: playlist.owner?.toString() 
      });
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only edit your own playlists'
      });
    }

    // Parse multipart form data
    const form = await readMultipartFormData(event);
    if (!form) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data provided'
      });
    }

    // Find image file in form data
    const imageFile = form.find(item => item.name === 'cover');
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

    // Basic validation
    if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
      throw createError({
        statusCode: 400,
        statusMessage: 'File size too large. Maximum size is 5MB.'
      });
    }

    // Validate image type based on buffer
    const isValidImage = buffer.length > 0 && (
      buffer.subarray(0, 3).toString('hex') === 'ffd8ff' || // JPEG
      buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' || // PNG
      buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a' || // GIF
      buffer.subarray(0, 4).toString() === 'RIFF' // WebP
    );

    if (!isValidImage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are supported.'
      });
    }

    // Delete old cover if it exists
    if (playlist.coverUrl) {
      logger.info('PlaylistCoverAPI: Old cover URL found');
      await imageUploadService.deleteImage(playlist.coverUrl);
    }

    // Upload new cover to OSS
    const uploadResult = await imageUploadService.uploadPlaylistCover(buffer, `${filenameWithoutExtension}-${makeid(10)}.${extension}`, playlistId);

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
      { in: "path", name: "id", required: true, schema: { type: 'string' } }
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
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    coverUrl: { type: 'string' },
                    path: { type: 'string' },
                    name: { type: 'string' }
                  }
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
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '403': {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
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
}); 