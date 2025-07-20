import { z } from 'zod'
import { Users, UserAuth } from '~/server/models'
import { hashPasswordCustom } from '~/server/utils/auth'
import BakaLogger from '~/server/utils/BakaLogger'

const logger = BakaLogger.child({ service: 'Auth' })

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userName: z.string().min(3),
})

export default defineEventHandler(async (event) => {
  const { email, password, userName } = await readValidatedBody(event, bodySchema.parse)

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

    // Set user session
    await setUserSession(event, {
      userId: user._id.toString(),
      pwdHash: pwdHash,
      loggedInAt: new Date()
    })
    
    return {
      user: {
        id: user._id,
        email,
        userName: user.userName,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
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
    $global: {
      components: {
        schemas: {
          RegisterRequest: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
              userName: { type: 'string' }
            },
            required: ['email', 'password', 'userName']
          },
        }
      }
    },
    tags: ["Auth"],
    description: "User registration",
    requestBody: {
      content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
    },
    responses: {
      '200': {
        description: 'Registration successful',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } }
      },
      '400': {
        description: 'Bad request - email or username already exists',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
}) 