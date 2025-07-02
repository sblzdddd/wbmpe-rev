import { z } from 'zod'
import { verifyPassword } from '~/server/utils/auth'
import { Users, UserAuth } from '~/server/models'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  try {
    // Find user auth by email
    const userAuth = await UserAuth.findOne({ email }).populate('userId')
    
    if (!userAuth || !userAuth.pwdHash) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userAuth.pwdHash)
    
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Get user data
    const user = await Users.findById(userAuth.userId)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }

    // Create session
    
    // Set session data
    await setUserSession(event, {
      id: user._id.toString(),
      email: email,
      userName: user.userName,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl
    });

    console.log('After login - session:', await getUserSession(event))

    return {
      user: {
        id: user._id.toString(),
        email: email,
        userName: user.userName,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})
