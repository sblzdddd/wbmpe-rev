const logger = BakaLogger.child({service: 'SongStreamAPI'})

export default defineEventHandler(async (event) => {
  const songId = getRouterParam(event, 'id');
  
  if (!songId || !isValidObjectIdString(songId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid song ID"
    });
  }

  try {
    const stream = await Streams.getAllQualityUrls(songId);
    
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