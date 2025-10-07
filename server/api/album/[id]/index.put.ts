// update album by id

const logger = BakaLogger.child({ service: 'AlbumUpdateAPI' });

export default defineEventHandler(async (event) => {
  try {
    const { id: albumId } = await parseRouteParams(event, albumRequestParamsInternal);

    logger.info(`AlbumUpdateAPI: Updating album ${albumId}`);

    const album = await checkAlbumEditAccess(event, albumId);

    const result = await readValidatedBody(event, albumUpdateRequest.safeParse);
    if (!result.success) {
      throw createError({statusCode: 400, statusMessage: result.error.message});
    }
    const { name, description, coverUrl } = result.data;

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

    // Handle cover URL update
    if (coverUrl !== undefined) {
      // If coverUrl is empty string, remove the cover
      if (coverUrl === '' && album.coverUrl) {
        // TODO: Delete old cover from media service if needed
        // await mediaUploadService.deleteMedia(album.coverUrl);
      }
      updateData.coverUrl = coverUrl;
    }

    // Update the album
    const updatedAlbum = await Albums.updateAlbum(albumId, updateData);

    logger.info(`AlbumUpdateAPI: Album ${albumId} updated successfully`);

    return {
      success: true,
      data: {
        _id: updatedAlbum._id,
        name: updatedAlbum.name,
        description: updatedAlbum.description,
        coverUrl: updatedAlbum.coverUrl,
        platform: updatedAlbum.platform
      }
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('AlbumUpdateAPI: Update failed', { error });
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
    description: "Update an album's metadata (partial updates supported)",
    parameters: [
      { $ref: '#/components/parameters/albumIdParam' }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/albumUpdateRequest' }
        }
      }
    },
    responses: {
      '200': {
        description: 'Successful update',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/albumUpdateResponse' } } }
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
        description: 'Album not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
}); 
