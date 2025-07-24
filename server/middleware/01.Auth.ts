import { ObjectId } from "mongodb"
import { UserAuth, type UserAuthDocument } from "../models"

const logger = BakaLogger.child({service: 'AuthMiddleware'})

export default defineEventHandler(async (event) => {
  // Get the request URL
  const url = getRequestURL(event)
  
  // Define endpoints that require authentication for specific methods only
  const methodSpecificEndpoints = [
    { path: '/api/playlist/', methods: ['PUT', 'POST', 'DELETE'] }, // Protect update/create/delete operations only
    { path: '/api/user', methods: ['GET', 'POST'] },
    { path: '/api/upload', methods: ['POST'] },
  ]
  
  // Check if this is a method-specific protected endpoint
  const requiresAuth = methodSpecificEndpoints.some(({ path, methods }) => 
    url.pathname.startsWith(path) && methods.includes(event.method || 'GET')
  )
  
  // Skip authentication check for non-protected endpoints
  if (!requiresAuth) {
    return
  }
  
  try {
    // Get current user from session
    const session = await getUserSession(event)
    // Check if session has actual user data (not just a session ID)
    // A valid session should have id, pwdHash
    if (!session || !session.userId || typeof session.userId !== 'string' || (!session.pwdHash && !session.githubId && !session.googleId)) {
      logger.warn('Auth middleware: Invalid session data:', session)
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    // Verify the session against the database, based on the type of auth
    let userAuth: UserAuthDocument | null = null
    if (session.pwdHash) {
      userAuth = await UserAuth.findOne({userId: new ObjectId(session.userId), pwdHash: session.pwdHash})
    } else if (session.githubId) {
      userAuth = await UserAuth.findOne({userId: new ObjectId(session.userId), githubId: session.githubId})
    } else if (session.googleId) {
      userAuth = await UserAuth.findOne({userId: new ObjectId(session.userId), googleId: session.googleId})
    }

    if(!userAuth) {
      logger.warn('Auth middleware: User auth not found in database')
      // clear the invalid session
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    // Add user info to event context for use in API handlers
    event.context.user = {
      id: session.userId,
      email: userAuth.email,
      githubId: userAuth.githubId,
      googleId: userAuth.googleId
    }
    
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    logger.error('Auth middleware error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error: ' + error
    })
  }
}) 