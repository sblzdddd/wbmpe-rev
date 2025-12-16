const logger = BakaLogger.child({ service: 'SendVerification' })

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, RegisterSendVerificationRequest.safeParse)
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { email } = result.data

  try {
    const existingUser = await UserAuth.findOne({ email })
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email is already registered'
      })
    }

    await EmailVerificationToken.deleteMany({ email })
    const verificationCode = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await EmailVerificationToken.create({
      email,
      code: verificationCode,
      expiresAt,
      used: false,
      verified: false
    })

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