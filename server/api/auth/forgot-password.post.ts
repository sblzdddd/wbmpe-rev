import { z } from 'zod'
import { UserAuth } from '../../models'
import PasswordResetToken from '../../models/PasswordResetToken'
import { sendPasswordResetEmail, generateResetToken } from '../../utils/emailSender'
import BakaLogger from '../../utils/BakaLogger'

const bodySchema = z.object({
  email: z.string().email()
})

const logger = BakaLogger.child({service: 'ForgotPasswordAPI'})

export default defineEventHandler(async (event) => {
  const { email } = await readValidatedBody(event, bodySchema.parse)
  logger.info('Password reset request received', { email })

  try {
    // Check if user exists
    const userAuth = await UserAuth.findOne({ email })
    
    if (!userAuth) {
      logger.warn('Password reset requested for non-existent email', { email })
      // Don't reveal if email exists or not for security
      return { success: true, message: 'If the email exists, a password reset link has been sent.' }
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save reset token
    await PasswordResetToken.create({
      email,
      token: resetToken,
      expiresAt
    })

    // Generate reset URL
    const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`

    // Send email
    await sendPasswordResetEmail(email, resetToken, resetUrl)

    logger.info('Password reset email sent successfully', { email })
    
    return { 
      success: true, 
      message: 'If the email exists, a password reset link has been sent.' 
    }
  } catch (error: unknown) {
    logger.error('Password reset error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process password reset request'
    })
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          ForgotPasswordRequest: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' }
            },
            required: ['email']
          },
          ForgotPasswordResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
        }
      }
    },
    tags: ["Auth"],
    description: "Request password reset",
    requestBody: {
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } }
    },
    responses: {
      '200': {
        description: 'Password reset request processed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordResponse' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})