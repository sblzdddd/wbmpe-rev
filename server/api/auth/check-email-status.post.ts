import EmailVerificationToken from "../../models/EmailVerificationToken"
import UserAuth from "../../models/UserAuth"
import BakaLogger from "../../utils/BakaLogger"

const logger = BakaLogger.child({ service: 'CheckEmailStatus' })

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  try {
    // Check if email is already registered
    const existingUser = await UserAuth.findOne({ email })
    if (existingUser) {
      return {
        status: 'registered',
        message: 'Email is already registered'
      }
    }

    // Check for pending verification tokens
    const pendingToken = await EmailVerificationToken.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (pendingToken) {
      return {
        status: 'pending_verification',
        message: 'Email has pending verification',
        verified: pendingToken.verified
      }
    }

    return {
      status: 'new',
      message: 'Email is available for registration'
    }
  } catch (error) {
    logger.error('Failed to check email status', { email, error })
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check email status'
    })
  }
}) 