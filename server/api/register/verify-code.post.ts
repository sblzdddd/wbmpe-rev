const logger = BakaLogger.child({ service: 'RegisterVerifyCode' })

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, RegisterVerifyCodeRequest.safeParse)
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { email, code } = result.data

  try {
    // Find the verification token
    const verificationToken = await EmailVerificationToken.findOne({
      email,
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!verificationToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired verification code'
      })
    }

    // Mark the token as verified (but not used yet)
    await EmailVerificationToken.updateOne(
      { _id: verificationToken._id },
      { verified: true }
    )

    logger.info('Verification code verified successfully', { email })

    return {
      success: true,
      message: 'Code verified successfully',
      verificationToken: verificationToken._id.toString()
    }
  } catch (error) {
    logger.error('Failed to verify code', { email, error })
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify code'
    })
  }
}) 