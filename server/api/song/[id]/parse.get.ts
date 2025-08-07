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
    const stream = await Streams.parseSong(songId);
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
    logger.error('Error parsing song:', error);
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw createError({
          statusCode: 404,
          statusMessage: error.message
        });
      }
      if (error.message.includes('Duration is too long')) {
        throw createError({
          statusCode: 400,
          statusMessage: error.message
        });
      }
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to parse song"
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