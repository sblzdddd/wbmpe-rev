const logger = BakaLogger.child({ service: 'Auth' })

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, registerSchema.safeParse)
  if (!result.success) {
    throw createError({statusCode: 400, statusMessage: result.error.message})
  }
  const { email, password, userName } = result.data

  try {
    // Check if email already exists
    const existingUserAuth = await UserAuth.findOne({ email })
    if (existingUserAuth) {
      throw createError({
        statusCode: 400,
        message: 'Email already registered'
      })
    }

    // Check if username already exists
    const existingUser = await Users.findOne({ userName })
    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: 'Username already taken'
      })
    }

    // Hash password using custom auth utility
    const pwdHash = await hashPasswordCustom(password)

    const user = await Users.createNewUser(userName, email, pwdHash)

    // verify and return user info
    const userInfo = await Users.getUserInfo(user._id.toString())

    // Set user session
    await setUserSession(event, {
      userId: user._id.toString(),
      pwdHash: pwdHash,
      loggedInAt: new Date()
    })
    
    return {
      user: userInfo
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    logger.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Registration failed'
    })
  }
})

defineRouteMeta({
  openAPI: {
    tags: ["Register"],
    description: "User registration",
    responses: {
      '200': {
        description: 'Registration successful',
      },
      '400': {
        description: 'Bad request - email or username already exists',
      },
      '500': {
        description: 'Internal server error',
      }
    }
  }
}) 