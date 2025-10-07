const logger = BakaLogger.child({ service: 'AlbumAPI' });

export default defineEventHandler(async (event) => {
  try {
    logger.info('AlbumAPI: Getting albums list');

    // Get pagination parameters from query
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 100, 1000); // Cap at 1000

    // Get albums from database
    const { albums, total } = await Albums.getAllAlbums(page, limit);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: albums,
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
    logger.error('AlbumAPI: Server Error getting albums list', { error });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Album"],
    description: "Get all albums",
    parameters: [
      { in: "query", name: "page", required: false, schema: { type: 'number', default: 1 } },
      { in: "query", name: "limit", required: false, schema: { type: 'number', default: 100 } }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/albumListResponse' } } }
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
}) 