import { Router } from "express";

import { AuthController } from "./auth.controller";



import {
  registerSchema,
  loginSchema,
} from "./auth.validation";
import { validateSchma } from "../../middleware/validate.middleware";
import passport from "passport";

const router =Router();

  router.post(
  "/register",
  validateSchma(
    registerSchema
  ),
  AuthController.register
);

router.post(
  "/login",
  validateSchma(
    loginSchema
  ),
  AuthController.login
);

router.post(
  "/refresh-token",
  AuthController.refreshToken
);

router.post(
  "/logout",
  AuthController.logout
);


router.get(
  "/google",
  passport.authenticate(
    "google",
    {
      scope: [
        "profile",
        "email",
      ],
    }
  )
);

router.get(
  "/google/callback",

  passport.authenticate(
    "google",
    {
      session: false,
    }
  ),

  AuthController.googleLogin
);


export const authRoute = router;