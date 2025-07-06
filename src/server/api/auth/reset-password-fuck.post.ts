import { z } from 'zod'
import { UserAuth } from '~/server/models'
import BakaLogger from '~/server/utils/BakaLogger'
import { hashPassword } from '~/server/utils/auth'

const bodySchema = z.object({
  email: z.string(),
  password: z.string().min(8)
})

const logger = BakaLogger.child({service: 'ResetPasswordAPI'})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)
  logger.info('Password reset attempt', { email: email })

  try {
    // Find user auth
    const userAuth = await UserAuth.findOne({ email: email })
    
    if (!userAuth) {
      logger.error('User auth not found for reset token', { email: email })
      throw createError({
        statusCode: 400,
        message: 'Invalid email'
      })
    }

    // Hash new password using custom auth utility
    const hashedPassword = await hashPassword(password)

    // Update user password
    await UserAuth.findByIdAndUpdate(userAuth._id, {
      pwdHash: hashedPassword
    })

    
    return { 
      success: true, 
      message: 'Password has been reset successfully' 
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    logger.error('Password reset error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to reset password'
    })
  }
})

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        schemas: {
          ResetPasswordRequestEmail: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              password: { type: 'string' }
            },
            required: ['email', 'password']
          },
          ResetPasswordResponse: {
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
    description: "Reset password with email",
    requestBody: {
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequestEmail' } } }
    },
    responses: {
      '200': {
        description: 'Password reset successful',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordResponse' } } }
      },
      '400': {
        description: 'Invalid or expired token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      },
      '500': {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
      }
    }
  }
})