import { sendEmailVerificationCode, generateVerificationCode } from "~/server/utils/emailSender"
import EmailVerificationToken from "~/server/models/EmailVerificationToken"
import UserAuth from "~/server/models/UserAuth"
import BakaLogger from "~/server/utils/BakaLogger"

const logger = BakaLogger.child({ service: 'SendVerification' })

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format'
    })
  }

  try {
    // Check if email is already registered
    const existingUser = await UserAuth.findOne({ email })
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email is already registered'
      })
    }

    // Clean up any existing verification tokens for this email
    await EmailVerificationToken.deleteMany({ email })

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode()

    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Store verification token
    await EmailVerificationToken.create({
      email,
      code: verificationCode,
      expiresAt,
      used: false,
      verified: false
    })

    // Send verification email
    await sendEmailVerificationCode(email, verificationCode)

    logger.info('Verification code sent successfully', { email })

    return {
      success: true,
      message: 'Verification code sent to your email'
    }
  } catch (error) {
    logger.error('Failed to send verification code', { email, error })
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send verification code'
    })
  }
}) 