import { Router } from 'express';

import { createReviewSchema, listReviewsQuerySchema } from './review.interface';
import * as reviewController from './reviewController';
import { validateSchma } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';

/**
 * Unlike other modules, these routes intentionally span two URL shapes:
 * nested under a property for create/list (`/properties/:id/reviews`), and
 * flat for delete (`/reviews/:id`), since removing a review only needs the
 * review's own id. That's why this router is mounted at the bare '/api/v1'
 * prefix in app.ts instead of a single dedicated prefix like the other modules.
 */
const router = Router();

// --- Nested under a property ---
router.get(
  '/properties/:id/reviews',
  validateSchma(listReviewsQuerySchema, 'query'),
  reviewController.listReviewsByProperty
);

router.post(
  '/properties/:id/reviews',
  requireAuth,
  validateSchma(createReviewSchema),
  reviewController.createReview
);

// --- Flat ---
router.delete('/reviews/:id', requireAuth, reviewController.deleteReview);

export const reviewRouter = router;