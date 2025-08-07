const logger = BakaLogger.child({service: 'UserQueueAPI'})

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required"
    });
  }

  try {
    const queueData = await Users.getUserQueue(userId);
    
    return queueData
  } catch (error) {
    logger.error('Error fetching user queue:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch queue"
    });
  }
});

defineRouteMeta({
  openAPI: {
    tags: ["User"],
    description: "Get current user's playback queue",
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/userQueueResponse' } } }
      },
      '401': {
        description: 'Not authenticated',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      }
    }
  }
}); 