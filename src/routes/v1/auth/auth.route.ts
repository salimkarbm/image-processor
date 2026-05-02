import { Router } from 'express';
import { signUp } from '../../../controllers';
import { validateInputWithZod } from '../../../middlewares';
import { signUpSchema, signUpSchemaRules } from '../../../users/validations';

const router = Router();

router.post(
  '/sign-up',
  validateInputWithZod(signUpSchema, signUpSchemaRules),
  signUp,
);

export default router;
