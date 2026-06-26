import passport from "passport";

import { Strategy as GoogleStrategy }
from "passport-google-oauth20";

import { User } from "../modules/user/user.model";
import { UserRole } from "../constraints/userRole";
import { env } from "./env";



passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,

      clientSecret: env.google.clientSecret,

      callbackURL: env.google.callbackUrl
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        const email =profile.emails?.[0]?.value;

        let user =
          await User.findOne({
            email,
          });

        if (!user) {
          user =
            await User.create({
              name:
                profile.displayName,

              email,

              provider:
                "google",

              role:
                UserRole.USER,
            });
        }

        return done(
          null,
          user
        );
      } catch (error) {
        done(
          error as Error
        );
      }
    }
  )
);