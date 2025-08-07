const logger = BakaLogger.child({service: 'SongParseAPI'})

export default defineEventHandler(async (event) => {
  const songId = getRouterParam(event, 'id');
  
  if (!songId || !isValidObjectIdString(songId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid song ID"
    });
  }

  try {
    // not completed, ignore the error
    const stream = await Streams.parseSong(songId);
    // @ts-expect-error not completed, ignore the error
    if (!stream) {
      throw createError({
        statusCode: 404,
        statusMessage: "Audio stream not found"
      });
    }

    return {
      data: stream
    };
  } catch (error) {
    logger.error('Error fetching audio stream:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch audio stream"
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["Song"],
    description: "Parse and get audio stream information for a song",
    parameters: [
      { $ref: '#/components/parameters/songIdParam' }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/songParseResponse' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '404': {
        description: 'Song not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
}); 