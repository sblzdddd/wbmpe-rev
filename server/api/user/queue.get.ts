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