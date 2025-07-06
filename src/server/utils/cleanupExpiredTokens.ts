import PasswordResetToken from '~/server/models/PasswordResetToken'
import BakaLogger from '~/server/utils/BakaLogger'

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
    
    // Find and delete expired tokens
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