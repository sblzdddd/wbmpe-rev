const logger = BakaLogger.child({service: 'UserQueueAPI'})

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required"
    });
  }

  const result = await readValidatedBody(event, userQueueSchema.safeParse);
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { songs, currentIndex, currentTime } = result.data;

  try {
    await Users.updateUserQueue(userId, songs, currentIndex, currentTime);
    
    return {
      success: true,
      message: "Queue updated successfully"
    };
  } catch (error) {
    logger.error('Error updating user queue:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update queue"
    });
  }
}); 