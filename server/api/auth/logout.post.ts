const logger = BakaLogger.child({ service: 'Logout' })

export default defineEventHandler(async (event) => {
  try {
    // Clear user session
    await clearUserSession(event)
    
    return { success: true }
  } catch (error: unknown) {
    logger.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    description: "User logout",
    responses: {
      '200': {
        description: 'Logout successful',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
}) 