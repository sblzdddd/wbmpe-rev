import { z } from 'zod';
import { emailSchema, passwordSchema, successResponseSchema } from './common';
import { simpleUserSchema } from './user';

// -----------REQUEST SCHEMAS-----------

export const loginRequest = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordRequest = z.object({
  email: emailSchema,
});

export const resetPasswordRequest = z.object({
  token: z.string().meta({
    description: "The token for resetting the password",
    example: "baka".repeat(32),
  }),
  password: passwordSchema,
});

// -----------RESPONSE SCHEMAS-----------

export const loginResponse = z.object({
  user: simpleUserSchema,
});

export const forgotPasswordResponse = successResponseSchema.extend({
  message: z.string().meta({
    description: 'Success message',
    example: 'If the email exists, a password reset link has been sent.',
  }),
});

export const resetPasswordResponse = successResponseSchema.extend({
  message: z.string().meta({
    description: 'Success message',
    example: 'Password has been reset successfully',
  }),
});

export const logoutResponse = successResponseSchema;

// Legacy exports for backward compatibility
export const LoginRequest = loginRequest;
export const ForgotPasswordRequest = forgotPasswordRequest;
export const ResetPasswordRequest = resetPasswordRequest;