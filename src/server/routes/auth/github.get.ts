import { Users, UserAuth } from '~/server/models'
import BakaLogger from '~/server/utils/BakaLogger'

const logger = BakaLogger.child({ service: 'GitHubOAuth' })

export default defineOAuthGitHubEventHandler({
  config: {
    scope: ['user:email'],
  },
  async onSuccess(event, { user, tokens: _tokens }) {
    try {
      logger.info('login success:', { user: user.login, id: user.id })
      
      // Check if this GitHub access token already exists
      const existingUserAuth = await UserAuth.findOne({ githubId: user.id })
      
      if (existingUserAuth) {
        // User already exists, get user data and create session
        const existingUser = await Users.getSimpleUserInfo(existingUserAuth.userId.toString())
        
        // Set user session
        await setUserSession(event, {
          userId: existingUser._id.toString(),
          githubId: user.id,
          loggedInAt: new Date()
        })
        
        logger.info('existing user logged in', { userId: existingUser._id })
      } else {
        // Create new user with GitHub data
        let userName = user.login
        let counter = 1
        
        // Ensure unique username
        while (await Users.findOne({ userName })) {
          userName = `${user.login}${counter}`
          counter++
        }
        
        const newUser = await Users.createNewOAuthUser(
          userName,
          user.name || user.login,
          undefined, // email
          user.id.toString(), // githubId
          undefined, // googleId
          user.avatar_url
        )
        
        await setUserSession(event, {
          userId: newUser._id.toString(),
          githubId: user.id,
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
    description: "GitHub OAuth authentication - creates new user if access token not found, or logs in existing user",
    responses: {
      '302': {
        description: 'Redirect to home page on success or error page on failure'
      }
    }
  }
})
