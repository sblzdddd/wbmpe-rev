import { z } from 'zod'
import { Users, UserAuth } from '~/server/models'
import BakaLogger from '~/server/utils/BakaLogger'

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

    // Verify password
    const isValidPassword = await verifyPassword(password, userAuth.pwdHash)
    
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
      logger.error('User not found in database', {id: userAuth.userId})
      throw createError({
        statusCode: 401,
        message: 'User not found'
      })
    }
    
    // Set session data
    await setUserSession(event, {
      id: user._id.toString(),
      pwdHash: userAuth.pwdHash,
    });

    logger.log('success', 'Setting session for user', {id: user._id.toString(), userName: user.userName})
    logger.debug('After login - session:', await getUserSession(event))

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
    
    logger.error('Login error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
})
