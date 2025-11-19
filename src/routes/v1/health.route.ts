import { Router } from 'express';
import health from '../../controllers/v1/health.controller';

const router = Router();

router.get('/health', health);

export default router;
