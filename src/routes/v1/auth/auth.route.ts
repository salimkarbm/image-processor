import { Router } from 'express';
import { signUp, verifyEmail } from '../../../controllers';
import { validateInputWithZod } from '../../../middlewares';
import { signUpSchema, signUpSchemaRules } from '../../../auth/validations';
import {
  verifyEmailSchema,
  verifyEmailSchemaRules,
} from '../../../auth/validations/verify-email.validation';

const router = Router();

router.post(
  '/auth/sign-up',
  validateInputWithZod(signUpSchema, signUpSchemaRules),
  signUp,
);

router.post(
  '/auth/verify-email',
  validateInputWithZod(verifyEmailSchema, verifyEmailSchemaRules),
  verifyEmail,
);

export default router;
