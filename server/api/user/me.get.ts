const logger = BakaLogger.child({service: 'UserMeAPI'})

type BasicUserResponse = Omit<UserInfoResponse['user'], 'createdPlaylists' | 'favorites' | 'recent'>

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id
  
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }
    
    const user = await Users.getBasicUserInfo(userId)

    return user as BasicUserResponse
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
    description: "Get current user information",
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