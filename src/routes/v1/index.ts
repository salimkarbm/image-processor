import { Router } from 'express';
import healthRoute from './health.route';
import securityRoute from './security.route';
import authRoute from './auth/auth.route';

const router = Router();

// auth routes
router.use(authRoute);

// health routes
router.use(healthRoute);

// security routes
router.use(securityRoute);

export default router;
