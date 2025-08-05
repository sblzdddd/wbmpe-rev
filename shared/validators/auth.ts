import { z } from 'zod';

// Register Verify Code Schema
export const registerVerifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const registerVerifyTokenSchema = z.object({
  email: z.string().email(),
  verificationToken: z.string(),
});

export const registerSendVerificationSchema = z.object({
  email: z.string().email(),
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});