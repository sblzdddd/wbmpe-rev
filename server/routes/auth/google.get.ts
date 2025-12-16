const logger = BakaLogger.child({ service: 'GoogleOAuth' })

export default defineOAuthGoogleEventHandler({
  config: {
  },
  async onSuccess(event, { user, tokens }) {
    try {
      logger.info('login success:', { user: user.name, id: user.sub })
      
      const existingUserAuth = await UserAuth.findOne({ googleId: tokens.id_token })
      
      if (existingUserAuth) {
        // User already exists, get user data and create session
        const existingUser = await Users.getSimpleUserInfo(existingUserAuth.userId.toString())
        
        await setUserSession(event, {
          userId: existingUser._id.toString(),
          googleId: tokens.id_token,
          loggedInAt: new Date()
        })
        
        logger.info('existing user logged in', { userId: existingUser._id })
      } else {
        let userName = user.email.split('@')[0]
        let counter = 1
        
        while (await Users.findOne({ userName })) {
          userName = `${user.email.split('@')[0]}${counter}`
          counter++
        }
        
        const newUser = await Users.createNewOAuthUser(
          userName,
          user.name,
          user.email, // email
          undefined, // githubId
          tokens.id_token, // googleId
          user.picture
        )
        
        await setUserSession(event, {
          userId: newUser._id.toString(),
          googleId: tokens.id_token,
          loggedInAt: new Date()
        })
        
        logger.info('new user created', { userId: newUser._id, userName })
      }
      
      return sendRedirect(event, '/')
    } catch (error: unknown) {
      logger.error(error)
      return sendRedirect(event, '/?error=oauth_failed')
    }
  },
  onError(event, error) {
    logger.error(error)
    return sendRedirect(event, '/?error=oauth_failed')
  },
})

defineRouteMeta({
  openAPI: {
    tags: ["OAuth"],
    description: "Google OAuth authentication - creates new user if ID token not found, or logs in existing user",
    responses: {
      '302': {
        description: 'Redirect to home page on success or error page on failure'
      }
    }
  }
})
