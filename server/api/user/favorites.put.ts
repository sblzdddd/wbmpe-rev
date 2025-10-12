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
    description: "Add or remove song from user favorites",
    requestBody: {
      required: true,
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/userFavoritesUpdateRequest' } }
      }
    },
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { type: 'boolean' } } }
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
}) 