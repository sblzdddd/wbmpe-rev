const logger = BakaLogger.child({service: 'UserQueueAPI'})

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required"
    });
  }

  const result = await readValidatedBody(event, UserQueueUpdateRequest.safeParse);
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

defineRouteMeta({
  openAPI: {
    tags: ["User"],
    description: "Update current user's playback queue",
    requestBody: {
      required: true,
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/userQueueUpdateRequest' } }
      }
    },
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/successResponseSchema' } } }
      },
      '400': {
        description: 'Bad Request',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/validationErrorSchema' } } }
      },
      '401': {
        description: 'Not authenticated',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/generalErrorSchema' } } }
      },
    }
  }
}); 