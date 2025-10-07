const logger = BakaLogger.child({ service: 'AlbumSearchAPI' });

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    
    const result = albumSearchRequest.safeParse(query);
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: result.error.message
      });
    }
    
    const { name } = result.data;

    logger.info(`AlbumSearchAPI: Searching albums with name: ${name}`);

    // Search albums by name (case insensitive)
    const albums = await Albums.find({
      name: { $regex: name, $options: 'i' }
    })
    .select('_id name coverUrl platform')
    .limit(20)
    .lean();

    logger.info(`AlbumSearchAPI: Found ${albums.length} albums`);

    return {
      data: albums.map(album => ({
        _id: album._id.toString(),
        name: album.name,
        coverUrl: album.coverUrl,
        platform: album.platform
      }))
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('AlbumSearchAPI: Search failed', { error });
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
    description: "Search albums by name",
    parameters: [
      {
        in: "query",
        name: "name",
        required: true,
        schema: { type: "string" },
        description: "Album name to search for"
      }
    ],
    responses: {
      '200': {
        description: 'Successful search',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/albumSearchResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
});
