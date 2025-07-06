import BakaLogger from '~/server/utils/BakaLogger'

const logger = BakaLogger.child({ service: 'HerokuOAuth' })

export default defineOAuthHerokuEventHandler({
  config: {
  },
  async onSuccess(event, { user, tokens }) {
    console.log('Heroku OAuth success:', {user, tokens})
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    logger.error('Heroku OAuth error:', {error})
    return sendRedirect(event, '/')
  },
})
