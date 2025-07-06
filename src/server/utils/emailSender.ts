import nodemailer from 'nodemailer'
import BakaLogger from './BakaLogger'
import crypto from 'crypto'

const logger = BakaLogger.child({service: 'EmailSender'})

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('EMAIL_USER and EMAIL_PASSWORD must be set')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

export const sendPasswordResetEmail = async (email: string, resetToken: string, resetUrl: string) => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - WBMPE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your WBMPE account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The WBMPE Team</p>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info('Password reset email sent successfully', { email, messageId: info.messageId })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error })
    throw error
  }
}

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}