const logger = BakaLogger.child({ service: 'CleanupExpiredTokens' })

export interface CleanupResult {
  success: boolean
  deletedCount: number
  timestamp: string
  message?: string
}

export async function cleanupExpiredTokens(): Promise<CleanupResult> {
  try {
    logger.info('Starting cleanup of expired password reset tokens')
    
    const now = new Date()
    
    const result = await PasswordResetToken.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { used: true }
      ]
    })
    
    logger.info('Cleanup completed', {
      deletedCount: result.deletedCount,
      timestamp: now.toISOString()
    })
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      timestamp: now.toISOString(),
      message: `Successfully cleaned up ${result.deletedCount} expired tokens`
    }
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', error)
    throw error
  }
} 

export async function cleanupExpiredEmailVerificationTokens(): Promise<CleanupResult> {
  try {
    logger.info('Starting cleanup of expired email verification tokens')
    
    const now = new Date()
    
    const result = await EmailVerificationToken.deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { used: true }
      ]
    })
    
    logger.info('Cleanup completed', {
      deletedCount: result.deletedCount,
      timestamp: now.toISOString()
    })
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      timestamp: now.toISOString(),
      message: `Successfully cleaned up ${result.deletedCount} expired email verification tokens`
    }
  } catch (error) {
    logger.error('Failed to cleanup expired email verification tokens', error)
    throw error
  }
}
