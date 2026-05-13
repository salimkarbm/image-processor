import { z } from 'zod';

export const verifyEmailSchema = z.object({
  email: z.email(),
  otp: z.string().min(6, 'OTP must be at least 6 characters long'),
});

export const verifyEmailSchemaRules: Record<
  string,
  Array<'trim' | 'escape' | 'xss'>
> = {
  email: ['trim', 'escape', 'xss'],
  otp: ['trim', 'escape', 'xss'],
};
