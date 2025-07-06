import BakaLogger from '~/server/utils/BakaLogger'

const logger = BakaLogger.child({ service: 'GoogleOAuth' })

export default defineOAuthGoogleEventHandler({
  config: {
  },
  async onSuccess(event, { user, tokens }) {
    console.log('Google OAuth success:', {user, tokens})
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    logger.error('Google OAuth error:', {error})
    return sendRedirect(event, '/')
  },
})
