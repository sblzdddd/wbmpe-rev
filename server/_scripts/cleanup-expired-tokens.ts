import mongoose from "mongoose"
import { MONGODB_URI } from "./baka"

const logger = BakaLogger.child({ service: 'CleanupExpiredTokensScript' })

async function cleanupExpiredTokens() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

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
    
    console.log(`Successfully cleaned up ${result.deletedCount} expired tokens`)
    console.log(`Timestamp: ${now.toISOString()}`)
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      timestamp: now.toISOString()
    }
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', error)
    console.error('Failed to cleanup expired tokens:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupExpiredTokens()
    .then(() => {
      console.log('Cleanup completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Cleanup failed:', error)
      process.exit(1)
    })
}

export default cleanupExpiredTokens 