const logger = BakaLogger.child({ service: 'SendVerification' })

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, RegisterSendVerificationRequest.safeParse)
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { email } = result.data

  try {
    // Check if email is already registered
    const existingUser = await UserAuth.findOne({ email })
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email is already registered'
      })
    }

    // Clean up any existing verification tokens for this email
    await EmailVerificationToken.deleteMany({ email })

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode()

    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Store verification token
    await EmailVerificationToken.create({
      email,
      code: verificationCode,
      expiresAt,
      used: false,
      verified: false
    })

    // Send verification email
    await sendEmailVerificationCode(email, verificationCode)

    logger.info('Verification code sent successfully', { email })

    return {
      success: true,
      message: 'Verification code sent to your email'
    }
  } catch (error) {
    logger.error('Failed to send verification code', { email, error })
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification code'
    })
  }
}) 