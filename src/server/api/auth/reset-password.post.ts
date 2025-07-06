import { z } from 'zod'
import { UserAuth } from '~/server/models'
import PasswordResetToken from '~/server/models/PasswordResetToken'
import BakaLogger from '~/server/utils/BakaLogger'

const bodySchema = z.object({
  token: z.string(),
  password: z.string().min(8)
})

const logger = BakaLogger.child({service: 'ResetPasswordAPI'})

export default defineEventHandler(async (event) => {
  const { token, password } = await readValidatedBody(event, bodySchema.parse)
  logger.info('Password reset attempt', { token: token.substring(0, 8) + '...' })

  try {
    // Find and validate reset token
    const resetToken = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetToken) {
      logger.warn('Invalid or expired reset token used', { token: token.substring(0, 8) + '...' })
      throw createError({
        statusCode: 400,
        message: 'Invalid or expired reset token'
      })
    }

    // Find user auth
    const userAuth = await UserAuth.findOne({ email: resetToken.email })
    
    if (!userAuth) {
      logger.error('User auth not found for reset token', { email: resetToken.email })
      throw createError({
        statusCode: 400,
        message: 'Invalid reset token'
      })
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update user password
    await UserAuth.findByIdAndUpdate(userAuth._id, {
      pwdHash: hashedPassword
    })

    // Mark token as used
    await PasswordResetToken.findByIdAndUpdate(resetToken._id, {
      used: true
    })

    logger.info('Password reset successful', { email: resetToken.email })
    
    return { 
      success: true, 
      message: 'Password has been reset successfully' 
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    logger.error('Password reset error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to reset password'
    })
  }
})