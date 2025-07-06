import { UserAuth } from "~/server/models"
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
    
    // Check if session has actual user data (not just a session ID)
    // A valid session should have id, pwdHash
    if (!session.id || !session.pwdHash) {
      logger.warn('Auth middleware: Invalid session data:', session)
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    // Verify the session against the database
    const userAuth = await UserAuth.findOne({userId: session.id, pwdHash: session.pwdHash})
    if(!userAuth) {
      logger.warn('Auth middleware: User auth not found in database')
      await clearUserSession(event)
      throw createError({
        statusCode: 401,
        message: 'Not authenticated'
      })
    }

    // Add user info to event context for use in API handlers
    event.context.user = {
      id: session.id,
      email: userAuth.email
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