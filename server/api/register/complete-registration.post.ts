const logger = BakaLogger.child({ service: 'CompleteRegistration' })

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, CompleteRegistrationRequest.safeParse)
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { verificationToken, userName, password } = result.data

  try {
    const emailToken = await EmailVerificationToken.findOne({
      _id: verificationToken,
      verified: true,
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!emailToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired verification token'
      })
    }

    // Check if username is already taken
    const existingUser = await Users.findOne({ userName })
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username is already taken'
      })
    }

    const pwdHash = await hashPasswordCustom(password)

    const user = await Users.createNewUser(userName, emailToken.email, pwdHash)

    await EmailVerificationToken.updateOne(
      { _id: verificationToken },
      { used: true }
    )

    logger.info('User registration completed successfully', { 
      email: emailToken.email, 
      userName,
      userId: user._id 
    })

    const userInfo = await Users.getUserInfo(user._id.toString())

    if (!userInfo) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get user info'
      })
    }

    return {
      success: true,
      message: 'Registration completed successfully',
      user: userInfo
    }
  } catch (error) {
    logger.error('Failed to complete registration', { userName, error })
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to complete registration'
    })
  }
}) 