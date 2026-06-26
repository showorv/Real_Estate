import jwt from "jsonwebtoken";

import crypto from "crypto";
import { UserRole } from "../constraints/userRole";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (
  payload: JwtPayload
) => {
  return jwt.sign(
    payload,
    env.jwt.accessSecret as string,
    {
      expiresIn: env.jwt.accessExpiresIn as string | number,
    }as jwt.SignOptions
  );
};

export const generateRefreshToken = (
  payload: JwtPayload
) => {
  return jwt.sign(
    payload,
    env.jwt.refreshSecret as string,
    {
      expiresIn: env.jwt.refreshExpiresIn as string | number,
    }as jwt.SignOptions
  );
};

export const verifyToken = (
  token: string,
  secret: string
) => {
  return jwt.verify(token, secret);
};

export const hashToken = (
  token: string
) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};