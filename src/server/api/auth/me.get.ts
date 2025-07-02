export default defineEventHandler(async (event) => {
  try {
    // Get current user from session
    const session = await getUserSession(event)
    
    // Check if session has actual user data (not just a session ID)
    // A valid session should have id, email, and userName
    if (!session.id || !session.email || !session.userName) {
      console.log('Invalid session data:', session)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    console.log(session, "session")

    return {
      user: {
        id: session.id,
        email: session.email,
        userName: session.userName,
        nickName: session.nickName,
        avatarUrl: session.avatarUrl
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    console.error('Auth check error:', error)
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }
})