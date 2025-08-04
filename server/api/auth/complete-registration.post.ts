const logger = BakaLogger.child({ service: 'CompleteRegistration' })

export default defineEventHandler(async (event) => {
  const { verificationToken, userName, password } = await readBody(event)

  if (!verificationToken || !userName || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Verification token, username, and password are required'
    })
  }

  // Validate username (min 3 characters)
  if (userName.length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username must be at least 3 characters long'
    })
  }

  // Validate password (min 8 characters)
  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long'
    })
  }

  try {
    // Find and validate the verification token
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

    // Hash the password
    const pwdHash = await hashPasswordCustom(password)

    // Create the user
    const user = await Users.createNewUser(userName, emailToken.email, pwdHash)

    // Mark the verification token as used
    await EmailVerificationToken.updateOne(
      { _id: verificationToken },
      { used: true }
    )

    logger.info('User registration completed successfully', { 
      email: emailToken.email, 
      userName,
      userId: user._id 
    })

    // verify and return user info
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