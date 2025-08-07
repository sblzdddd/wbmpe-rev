import { z } from 'zod';
import { emailSchema, passwordSchema } from './common';

// Register Verify Code Schema
export const RegisterVerifyCodeRequest = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits').meta({
    description: "The verification code",
    example: "123456",
  }),
});

export const RegisterVerifyTokenRequest = z.object({
  email: emailSchema,
  verificationToken: z.string().meta({
    description: "The verification token",
    example: "baka".repeat(32),
  }),
});

export const RegisterSendVerificationRequest = z.object({
  email: emailSchema,
});

// Complete Registration Schema
export const CompleteRegistrationRequest = z.object({
  verificationToken: z.string().meta({
    description: 'The verification token',
    example: 'baka'.repeat(32),
  }),
  userName: z.string().min(3, 'Username must be at least 3 characters long').meta({
    description: 'The username of the user',
    example: 'username',
  }),
  password: passwordSchema,
}).meta({
  description: 'Complete registration request with detailed user information',
  example: {
    verificationToken: 'baka'.repeat(32),
    userName: 'username',
    password: 'password@123456',
  },
});