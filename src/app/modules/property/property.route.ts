import { Router } from 'express';


import * as propertyController from './property.controller';
import { validateSchma } from '../../middleware/validate.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/checkRole';
import { UserRole } from '../../constraints/userRole';
import { createPropertySchema, listPropertiesQuerySchema, moderationQueueQuerySchema, myPropertiesQuerySchema, updatePropertySchema, updatePropertyStatusSchema } from './property.interface';

const router = Router();

// --- Public ---
router.get('/', validateSchma(listPropertiesQuerySchema, 'query'), propertyController.listProperties);

// --- Specific authenticated routes BEFORE the generic '/:slug' below ---
router.get(
  '/mine',
  requireAuth,
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  validateSchma(myPropertiesQuerySchema, 'query'),
  propertyController.getMyProperties
);

router.get(
  '/moderation',
  requireAuth,
  requireRole(UserRole.ADMIN),
  validateSchma(moderationQueueQuerySchema, 'query'),
  propertyController.getModerationQueue
);

router.get('/:id/related', propertyController.getRelatedProperties);

// --- Generic public detail (optionalAuth so an owner/admin can preview their own pending/rejected listing) ---
router.get('/:slug', propertyController.getPropertyBySlug);

// --- Mutations ---
router.post(
  '/',
  requireAuth,
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  validateSchma(createPropertySchema),
  propertyController.createProperty
);

router.patch(
  '/:id/status',
  requireAuth,
  requireRole(UserRole.ADMIN),
  validateSchma(updatePropertyStatusSchema),
  propertyController.updatePropertyStatus
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(UserRole.MANAGER, UserRole.ADMIN),
  validateSchma(updatePropertySchema),
  propertyController.updateProperty
);

router.delete('/:id', requireAuth, requireRole(UserRole.MANAGER, UserRole.ADMIN), propertyController.deleteProperty);

export default router;