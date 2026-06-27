import { Router } from 'express';

import { UserRole } from '../../constraints/userRole';
import {
  createInquirySchema,
  updateInquiryStatusSchema,
  listInquiriesQuerySchema,
} from './inquiry.interface';
import * as inquiryController from './inquiry.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateSchma } from '../../middleware/validate.middleware';
import { requireRole } from '../../middleware/checkRole';

const router = Router();

// Every inquiry route requires a logged-in user
router.use(requireAuth);

// GET is role-scoped inside inquiry.service (user: own submissions, manager:
// own leads, admin: everything) -- no requireRole gate needed here.
router.get('/', validateSchma(listInquiriesQuerySchema, 'query'), inquiryController.listInquiries);

router.post('/', validateSchma(createInquirySchema), inquiryController.createInquiry);

// Not in the original locked API surface (which only specified POST + GET),
// but the status field is dead weight without a way to move it off
// 'pending' -- added here, manager-on-own-lead or admin only, mirroring the
// property status-update pattern.
router.patch(
  '/:id/status',
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  validateSchma(updateInquiryStatusSchema),
  inquiryController.updateInquiryStatus
);

export const inquiryRouter = router;

