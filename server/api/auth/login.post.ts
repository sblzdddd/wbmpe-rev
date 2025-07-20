import { z } from 'zod'
import { Users, UserAuth } from '../../models'
import BakaLogger from '../../utils/BakaLogger'
import { verifyPassword } from '../../utils/auth'

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
    const userAuth = await UserAuth.findOne({ email }).populate('userId')
    
    if (!userAuth || !userAuth.pwdHash) {
      logger.error('UserAuth not found / valid in database', {email: email})
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Verify password using custom auth utility
    logger.info('Attempting password verification', {
      email,
      hasStoredHash: !!userAuth.pwdHash,
      storedHashLength: userAuth.pwdHash?.length,
      passwordLength: password.length,
      storedHashPrefix: userAuth.pwdHash?.substring(0, 10) + '...',
      storedHashFormat: userAuth.pwdHash?.startsWith('$2a$') ? 'bcrypt' : 
                        userAuth.pwdHash?.startsWith('$2b$') ? 'bcrypt' : 
                        userAuth.pwdHash?.startsWith('$scrypt$') ? 'scrypt' : 'unknown'
    })
    
    const isValidPassword = await verifyPassword(password, userAuth.pwdHash)
    
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

    // Get user data
    const user = await Users.findById(userAuth.userId)
    
    if (!user) {
      logger.error('User not found in database', {email: email})
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    console.log(user._id.toString())

    // Set user session
    await setUserSession(event, {
      userId: user._id.toString(),
      pwdHash: userAuth.pwdHash,
      loggedInAt: new Date()
    })

    logger.info('Login successful', {email: email, userId: user._id})
    
    return {
      user: {
        id: user._id,
        email: userAuth.email,
        userName: user.userName,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
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
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } }
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
