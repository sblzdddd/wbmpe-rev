import { UserAuth } from "~/server/models"
import Users from "~/server/models/Users"

export default defineEventHandler(async (event) => {
  try {
    // Get current user from session
    const session = await getUserSession(event)
    
    // Check if session has actual user data (not just a session ID)
    // A valid session should have id, pwdHash
    if (!session.id || !session.pwdHash) {
      console.log('Invalid session data:', session)
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    const userAuth = await UserAuth.findOne({userId: session.id, pwdHash: session.pwdHash})
    if(!userAuth) {
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    const user = await Users.findById(userAuth.userId)
    if(!user) {
      await clearUserSession(event)
      throw createError({
        statusCode: 500,
        message: 'Internal server error: user not found'
      })
    }

    return {
      user: {
        id: user._id.toString(),
        email: userAuth.email,
        userName: user.userName,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    await clearUserSession(event)
    
    console.error('Auth check error:', error)
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } }
      },
      '401': {
        description: 'Not authenticated',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})