const logger = BakaLogger.child({ service: 'ValidateToken' })

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, registerVerifyTokenSchema.safeParse)
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { email, verificationToken } = result.data

  try {
    // Find the verification token
    const token = await EmailVerificationToken.findOne({
      _id: verificationToken,
      email,
      verified: true,
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!token) {
      return {
        valid: false,
        message: 'Invalid or expired verification token'
      }
    }

    logger.info('Token validation successful', { email, verificationToken })

    return {
      valid: true,
      message: 'Token is valid'
    }
  } catch (error) {
    logger.error('Failed to validate token', { email, verificationToken, error })
    
    return {
      valid: false,
      message: 'Token validation failed'
    }
  }
})