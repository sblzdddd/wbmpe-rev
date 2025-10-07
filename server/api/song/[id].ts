import Songs from '../../models/Songs';

const logger = BakaLogger.child({service: 'SongAPI'});

export default defineEventHandler(async (event) => {
  const songId = getRouterParam(event, 'id');
  
  if (!songId || !isValidObjectIdString(songId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid song ID"
    });
  }

  try {
    logger.info(`Fetching song details for ID: ${songId}`);
    
    // Find song and populate album and artists
    const song = await Songs.findById(songId)
      .populate({
        path: 'album',
        select: 'name coverUrl platform'
      })
      .populate({
        path: 'artists', 
        select: 'name platform'
      })
      .select('-__v')
      .lean();

    if (!song) {
      throw createError({
        statusCode: 404,
        statusMessage: "Song not found"
      });
    }

    logger.info(`Successfully fetched song: ${song.name}`);

    return {
      success: true,
      song: song as unknown as SongType
    };

  } catch (error) {
    logger.error(`Error fetching song ${songId}:`, error);
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch song details"
    });
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Song"],
    description: "Get a song by ID",
    parameters: [
      { $ref: '#/components/parameters/songIdParam' }
    ],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/songResponse' } } }
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