import { Router } from 'express';

import * as analyticsController from './analytics.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Role-scoping happens inside analytics.service (user/manager/admin each get
// a different response shape) -- no requireRole gate needed, just requireAuth.
router.get('/overview', requireAuth, analyticsController.getOverview);

export default router;