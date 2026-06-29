import { Router } from 'express';

import { UserRole } from '../../constraints/userRole';
import {
  generateDescriptionSchema,
  getRecommendationsSchema,
  recommendationHistoryQuerySchema,
} from './ai.interface';
import * as aiController from './ai.controller';
import { requireRole } from '../../middleware/checkRole';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateSchma } from '../../middleware/validate.middleware';

const router = Router();

// Part of the manager's create-listing flow -- draft the listing fields,
// generate a description, edit before save. No DB write happens here.
router.post(
  '/generate-description',
  requireAuth,
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  validateSchma(generateDescriptionSchema),
  aiController.generateDescription
);

router.post(
  '/recommendations',
  requireAuth,
  validateSchma(getRecommendationsSchema),
  aiController.getRecommendations
);

router.get(
  '/recommendations/history',
  requireAuth,
  validateSchma(recommendationHistoryQuerySchema, 'query'),
  aiController.getRecommendationHistory
);

// Public, like /properties/:id/related -- a detail-page feature, not gated behind auth.
router.get('/properties/:id/neighborhood-analysis', aiController.getNeighborhoodAnalysis);

export const aiRouter = router;