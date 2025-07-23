import { z } from 'zod'
import { Users, UserAuth } from '../../models'
import { verifyPasswordCustom } from '../../utils/auth'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const logger = BakaLogger.child({service: 'LoginAPI'})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)
  logger.info('Login request received', {email: email, password: password})

  try {
    // Find user auth by email
    const userAuth = await UserAuth.findOne({ email })
    
    if (!userAuth || !userAuth.pwdHash) {
      logger.error('UserAuth not found / valid in database', {email: email})
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }
    
    const isValidPassword = await verifyPasswordCustom(password, userAuth.pwdHash)
    
    logger.info('Password verification result', {
      email,
      isValidPassword,
      passwordProvided: password.substring(0, 3) + '***'
    })
    
    if (!isValidPassword) {
      logger.error('Invalid password for user', {email: email})
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    console.log('userAuth', userAuth.userId)

    // verify and return user info
    const userInfo = await Users.getUserInfo(userAuth.userId.toString())
    
    if (!userInfo) {
      logger.error('User not found in database', {email: email})
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Set user session
    await setUserSession(event, {
      userId: userInfo._id.toString(),
      pwdHash: userAuth.pwdHash,
      loggedInAt: new Date()
    })


    logger.info('Login successful', {email: email, userId: userInfo._id})
    
    return {
      user: userInfo
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    logger.error('Login error:', error)
    throw createError({
      statusCode: 500,
      message: 'Login failed'
    })
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          LoginRequest: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' }
            },
            required: ['email', 'password']
          },
        }
      }
    },
    tags: ["Auth"],
    description: "User login",
    requestBody: {
      content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
    },
    responses: {
      '200': {
        description: 'Login successful',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInfoResponse' } } }
      },
      '401': {
        description: 'Invalid credentials',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})
