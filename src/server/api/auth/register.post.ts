import { z } from 'zod'
import { Users, UserAuth } from '~/server/models'

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

    // Hash password
    const pwdHash = await hashPassword(password)

    const user = await Users.createNewUser(userName, email, pwdHash)

    // Create session for newly registered user
    await setUserSession(event, {
      id: user._id.toString(),
      pwdHash,
    });
    
    console.log('After registration - session:', await getUserSession(event))

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
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
}) 