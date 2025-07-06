import BakaLogger from '~/server/utils/BakaLogger'

const logger = BakaLogger.child({ service: 'GitHubOAuth' })

export default defineOAuthGitHubEventHandler({
  config: {
  },
  async onSuccess(event, { user, tokens }) {
    console.log('GitHub OAuth success:', {user, tokens})
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    logger.error('GitHub OAuth error:', {error})
    return sendRedirect(event, '/')
  },
})
