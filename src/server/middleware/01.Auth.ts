import { ObjectId } from "mongodb"
import { UserAuth, type UserAuthDocument } from "~/server/models"
import BakaLogger from "~/server/utils/BakaLogger"

const logger = BakaLogger.child({service: 'AuthMiddleware'})

export default defineEventHandler(async (event) => {
  // Get the request URL
  const url = getRequestURL(event)
  
  // Define protected API endpoints that require authentication
  const loginOnlyEndpoints = [
    '/api/user/me'
    // '/api/playlist',
    // '/api/albums',
    // '/api/artists',
    // '/api/songs',
    // '/api/explore',
    // '/api/home'
  ]
  
  // Check if the current endpoint should be protected
  const isLoginOnlyEndpoint = loginOnlyEndpoints.some(endpoint => 
    url.pathname.startsWith(endpoint)
  )
  
  // Skip authentication check for non-protected endpoints
  if (!isLoginOnlyEndpoint) {
    return
  }
  
  try {
    // Get current user from session
    const session = await getUserSession(event)
    console.log(session.userId)
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