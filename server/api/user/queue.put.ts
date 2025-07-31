import Users from "../../models/Users";

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id;
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required"
    });
  }

  const body = await readBody(event);
  const { songs, currentIndex, currentTime } = body;

  // Validate input only if provided
  if (songs !== undefined && songs !== null && !Array.isArray(songs)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Queue must be an array"
    });
  }

  if (currentIndex !== undefined && currentIndex !== null && currentIndex < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Current index must be a non-negative number"
    });
  }

  if (currentTime !== undefined && currentTime !== null && currentTime < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Current time must be a non-negative number"
    });
  }

  // Validate queue items only if songs array is provided
  if (songs && Array.isArray(songs)) {
    for (const item of songs) {
      console.log('item', item);
      if (!item.songId) {
        throw createError({
          statusCode: 400,
          statusMessage: "Each queue item must have songId"
        });
      }
    }
  }

  try {
    await Users.updateUserQueue(userId, songs, currentIndex, currentTime);
    
    return {
      success: true,
      message: "Queue updated successfully"
    };
  } catch (error) {
    console.error('Error updating user queue:', error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update queue"
    });
  }
}); 