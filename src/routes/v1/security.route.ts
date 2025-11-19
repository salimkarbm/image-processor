import { Router } from 'express';
import { securityHeader, securityRecommendations } from '../../controllers';

const router = Router();

router.post('/security/info', securityRecommendations);
router.post('/security/headers', securityHeader);

export default router;
