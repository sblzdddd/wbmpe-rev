import { ObjectId } from "mongodb"

const logger = BakaLogger.child({service: 'AuthMiddleware'})

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // Define endpoints that require authentication for specific methods only
  const methodSpecificEndpoints = [
    { path: '/api/playlist', methods: ['PUT', 'POST', 'DELETE'] }, // Protect update/create/delete operations only
    { path: '/api/user', methods: ['GET', 'POST', 'PUT'] },
    { path: '/api/upload', methods: ['POST'] },
    { path: '/api/search', methods: ['GET', 'POST'] },
    { path: '/api/user/subscribe', methods: ['POST'] },
  ]
  
  // Check if this is a method-specific protected endpoint
  const requiresAuth = methodSpecificEndpoints.some(({ path, methods }) => 
    url.pathname.startsWith(path) && methods.includes(event.method || 'GET')
  )
  
  try {
    const session = await getUserSession(event)
    
    if (session && session.userId && (session.pwdHash || session.githubId || session.googleId)) {
        let userAuth: UserAuthDocument | null = null
        if (session.pwdHash) {
          userAuth = await UserAuth.findOne({userId: new ObjectId(session.userId as string), pwdHash: session.pwdHash})
        } else if (session.githubId) {
          userAuth = await UserAuth.findOne({userId: new ObjectId(session.userId as string), githubId: session.githubId})
        } else if (session.googleId) {
          userAuth = await UserAuth.findOne({userId: new ObjectId(session.userId as string), googleId: session.googleId})
        }

        if(!userAuth) {
           logger.warn('Auth middleware: User auth not found in database for valid session', {userId: session.userId})
           await clearUserSession(event)
           // If auth is required, throw 401
           if (requiresAuth) {
             throw createError({
               statusCode: 401,
               message: 'Not authenticated (Session invalid)'
             })
           }
           return
        }
        
        event.context.user = {
            id: session.userId,
            email: userAuth.email,
            githubId: userAuth.githubId,
            googleId: userAuth.googleId
        }
        return
    }

    if (requiresAuth) {
       logger.warn('Auth middleware: No valid session found', { url: url.pathname })
       throw createError({
         statusCode: 401,
         message: 'Not authenticated'
       })
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
