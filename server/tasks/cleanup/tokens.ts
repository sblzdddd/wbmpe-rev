const logger = BakaLogger.child({ service: 'CleanupTokenTask' })

export default defineTask({
  meta: {
    name: 'cleanup-tokens',
    description: 'Clean up expired tokens',
  },
  run: async () => {
    try {
      logger.info('Starting cleanup of expired tokens')
      await cleanupExpiredTokens()
      await cleanupExpiredEmailVerificationTokens()
      return {
        result: "Success"
      }
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', error)
      return { result: "Fail" }
    }
  }
})
