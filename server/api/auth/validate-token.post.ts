const logger = BakaLogger.child({ service: 'ValidateToken' })

export default defineEventHandler(async (event) => {
  const { email, verificationToken } = await readBody(event)

  if (!email || !verificationToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and verification token are required'
    })
  }

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