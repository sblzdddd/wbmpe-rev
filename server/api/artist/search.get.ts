const logger = BakaLogger.child({ service: 'ArtistSearchAPI' });

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    
    const result = artistSearchRequest.safeParse(query);
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: result.error.message
      });
    }
    
    const { name } = result.data;

    logger.info(`ArtistSearchAPI: Searching artists with name: ${name}`);

    // Search artists by name (case insensitive)
    const artists = await Artists.find({
      name: { $regex: name, $options: 'i' }
    })
    .select('_id name avatarUrl platform')
    .limit(20)
    .lean();

    logger.info(`ArtistSearchAPI: Found ${artists.length} artists`);

    return {
      data: artists.map(artist => ({
        _id: artist._id.toString(),
        name: artist.name,
        avatarUrl: artist.avatarUrl,
        platform: artist.platform
      }))
    };

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
      throw error;
    }

    logger.error('ArtistSearchAPI: Search failed', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Artist"],
    description: "Search artists by name",
    parameters: [
      {
        in: "query",
        name: "name",
        required: true,
        schema: { type: "string" },
        description: "Artist name to search for"
      }
    ],
    responses: {
      '200': {
        description: 'Successful search',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/artistSearchResponse' } } }
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
