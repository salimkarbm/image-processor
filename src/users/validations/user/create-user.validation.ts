import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  fullName: z.string().toLowerCase(),
});

export const signUpSchemaRules: Record<
  string,
  Array<'trim' | 'escape' | 'xss'>
> = {
  email: ['trim', 'escape', 'xss'],
  password: ['trim', 'escape', 'xss'],
  fullName: ['trim', 'escape', 'xss'],
};
