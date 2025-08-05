import { z } from 'zod';

// Complete Registration Schema
export const completeRegistrationSchema = z.object({
  verificationToken: z.string(),
  userName: z.string().min(3, 'Username must be at least 3 characters long'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

// Register Schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  userName: z.string().min(3, 'Username must be at least 3 characters long'),
});
