const logger = BakaLogger.child({service: 'UserFavoritesAPI'})

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id
    const { songId, set } = await readBody(event)
  
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    if (!isValidObjectIdString(songId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid song id'
      })
    }
    
    await Users.setFavoriteSong(userId, songId, set)

    return true
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error 
    }
    
    logger.error('Error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error: ' + error
    })
  }
})

defineRouteMeta({
  openAPI: {

    tags: ["User"],
    description: "Get current user favorite song ids",
    responses: {
      '200': {
        description: 'Successful response',
      },
      '401': {
        description: 'Not authenticated',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
}) 