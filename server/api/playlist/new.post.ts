const logger = BakaLogger.child({ service: 'PlaylistAPI' });

export default defineEventHandler(async (event) => {

  try {
    const userId = event.context.user?.id;

    // Parse multipart form data for image upload support
    const form = await readMultipartFormData(event);
    if (!form) {throw createError({statusCode: 400, statusMessage: 'No form data provided'});}

    // Validate using schema
    const result = PlaylistCreateRequest.safeParse({
      name: form.find(item => item.name === 'name')?.data?.toString('utf-8'),
      description: form.find(item => item.name === 'description')?.data?.toString('utf-8'),
      isPublic: form.find(item => item.name === 'isPublic')?.data?.toString('utf-8'),
      cover: form.find(item => item.name === 'cover')
    });

    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.message});
    }
    const { name, description, isPublic, cover: coverFile } = result.data;

    logger.info('PlaylistAPI: Creating new playlist', { userId });

    // Handle optional image upload
    let coverUrl = '';
    if (coverFile) {
      // Generate temporary playlist ID for upload
      const tempId = makeid(24);
      const filename = coverFile.filename || 'cover.jpg';
      const filenameWithoutExtension = filename.split('.').slice(0, -1).join('.');
      const extension = filename.split('.').pop();
      const buffer = coverFile.data;

      // Upload image to OSS
      const uploadResult = await mediaUploadService.uploadMediaFromBuffer(
        buffer, 
        `playlist-covers/${filenameWithoutExtension}-${tempId}.${extension}`
      );
      coverUrl = uploadResult.url;
    }

    // Create playlist
    const playlist = await Users.createNewPlaylist(userId, name, description || '', coverUrl, isPublic || false);

    logger.info('PlaylistAPI: Playlist created successfully', { 
      playlistId: playlist._id, 
      userId,
      name,
      hasCover: !!coverUrl
    });

    return {
      success: true,
      data: {
        _id: playlist._id,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.coverUrl,
        isPublic: playlist.isPublic,
        owner: playlist.owner?.toString()
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('PlaylistAPI: Creation failed', { error });
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
    description: "Create a new playlist",
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: { $ref: '#/components/schemas/PlaylistCreateRequest' }
        }
      }
    },
    responses: {
      '200': {
        description: 'Playlist created successfully',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PlaylistCreateResponse' } } }
      },
      '400': {
        description: 'Bad request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    },
  }
})
