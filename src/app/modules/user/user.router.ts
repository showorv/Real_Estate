import { Router } from "express";




import { UserController } from "./user.controller";

import { updateProfileSchema } from "./user.validation";
import { validateSchma } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";

const router =
  Router();

router.get(
  "/me",
  requireAuth,
  UserController.getMe
);

router.patch(
  "/me",
  requireAuth,
  validateSchma(
    updateProfileSchema
  ),
  UserController.updateMe
);

export const userRoute = router;