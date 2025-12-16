const logger = BakaLogger.child({ service: 'ArtistAPI' });

export default defineEventHandler(async (event) => {
  try {
    logger.info('ArtistAPI: Getting artists list');

    // Get pagination parameters from query
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 100, 1000); // Cap at 1000
    const skip = (page - 1) * limit;

    // Get artists from database
    const [artists, total] = await Promise.all([
      Artists.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Artists.countDocuments()
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: artists.map(artist => ({
        ...artist,
        _id: artist._id.toString(),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    };

  } catch (error) {
    logger.error('ArtistAPI: Server Error getting artists list', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Artist"],
    description: "Get all artists",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/artistListResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
    }
  }
})