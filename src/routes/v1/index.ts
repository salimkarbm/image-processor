import { Router } from 'express';
import healthRoute from './health.route';
import securityRoute from './security.route';

const router = Router();

// health routes
router.use(healthRoute);

// security routes
router.use(securityRoute);

export default router;
