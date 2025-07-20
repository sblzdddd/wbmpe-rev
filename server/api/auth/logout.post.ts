export default defineEventHandler(async (event) => {
  try {
    // Get current session before clearing
    const session = await getUserSession(event)
    console.log('Before logout - session:', session)
    
    // Clear user session
    await clearUserSession(event)
    
    // Verify session is cleared
    const clearedSession = await getUserSession(event)
    console.log('After logout - session:', clearedSession)
    
    return { success: true }
  } catch (error: unknown) {
    console.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          LogoutResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' }
            }
          },
        }
      }
    },
    tags: ["Auth"],
    description: "User logout",
    responses: {
      '200': {
        description: 'Logout successful',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutResponse' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 