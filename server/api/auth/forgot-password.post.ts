const logger = BakaLogger.child({service: 'ForgotPasswordAPI'})

export default defineEventHandler(async (event) => {
  const { email } = await readValidatedBody(event, forgotPasswordSchema.parse);
  logger.info('Password reset request received', { email })

  try {
    // Check if user exists
    const userAuth = await UserAuth.findOne({ email })
    
    if (!userAuth) {
      logger.warn('Password reset requested for non-existent email', { email })
      // Don't reveal if email exists or not for security
      return { success: true, message: 'If the email exists, a password reset link has been sent.' }
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save reset token
    await PasswordResetToken.create({
      email,
      token: resetToken,
      expiresAt
    })

    // Generate reset URL
    const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    // Send email
    await sendPasswordResetEmail(email, resetToken, resetUrl)

    logger.info('Password reset email sent successfully', { email })
    
    return { 
      success: true, 
      message: 'If the email exists, a password reset link has been sent.' 
    }
  } catch (error: unknown) {
    logger.error('Password reset error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process password reset request'
    })
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Auth"],
    description: "Request password reset",
    responses: {
      '200': {
        description: 'Password reset request processed',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
})