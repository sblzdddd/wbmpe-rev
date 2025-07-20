import EmailVerificationToken from "~/server/models/EmailVerificationToken"
import BakaLogger from "~/server/utils/BakaLogger"

const logger = BakaLogger.child({ service: 'VerifyCode' })

export default defineEventHandler(async (event) => {
  const { email, code } = await readBody(event)

  if (!email || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and code are required'
    })
  }

  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(code)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Code must be 6 digits'
    })
  }

  try {
    // Find the verification token
    const verificationToken = await EmailVerificationToken.findOne({
      email,
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!verificationToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired verification code'
      })
    }

    // Mark the token as verified (but not used yet)
    await EmailVerificationToken.updateOne(
      { _id: verificationToken._id },
      { verified: true }
    )

    logger.info('Verification code verified successfully', { email })

    return {
      success: true,
      message: 'Code verified successfully',
      verificationToken: verificationToken._id.toString()
    }
  } catch (error) {
    logger.error('Failed to verify code', { email, error })
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify code'
    })
  }
}) 