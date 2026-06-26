
import { env } from "../../config/env";
import { HTTP_STATUS } from "../../constraints/httpStatus";
import { AppError } from "../../utils/apiError";
import { generateAccessToken, generateRefreshToken, hashToken, JwtPayload, verifyToken } from "../../utils/auth.utils";
import { User } from "../user/user.model";
import { RefreshToken } from "./refreshToken.model";

import jwt from "jsonwebtoken";


const register = async (
  payload: {
    name: string;
    email: string;
    password: string;
  }
) => {
  const existingUser =
    await User.findOne({
      email: payload.email,
    });

  if (existingUser) {
    throw new AppError(
      HTTP_STATUS.CONFLICT,
      "User already exists"
    );
  }

  const user = await User.create(payload);

  const jwtPayload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken =
    generateAccessToken(jwtPayload);

  const refreshToken =
    generateRefreshToken(jwtPayload);

  const decoded = jwt.decode(
    refreshToken
  ) as {
    exp: number;
  };

  await RefreshToken.create({
    userId: user._id,

    tokenHash:
      hashToken(refreshToken),

    expiresAt: new Date(
      decoded.exp * 1000
    ),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const login = async (
  email: string,
  password: string
) => {
  const user =
    await User.findOne({ email })
      .select("+password");

  if (!user) {
    throw new AppError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid credentials"
    );
  }

  const isMatched =
    await user.comparePassword(
      password
    );

  if (!isMatched) {
    throw new AppError(
      HTTP_STATUS.UNAUTHORIZED,
      "Invalid credentials"
    );
  }

  if (!user.isActive) {
    throw new AppError(
      HTTP_STATUS.FORBIDDEN,
      "User is inactive"
    );
  }

  user.lastLoginAt =
    new Date();

  await user.save();

  const jwtPayload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken =
    generateAccessToken(jwtPayload);

  const refreshToken =
    generateRefreshToken(jwtPayload);

  const decoded = jwt.decode(
    refreshToken
  ) as {
    exp: number;
  };

  await RefreshToken.create({
    userId: user._id,

    tokenHash:
      hashToken(refreshToken),

    expiresAt: new Date(
      decoded.exp * 1000
    ),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const refreshToken =
  async (
    refreshTokenValue: string
  ) => {
    const decoded =
      verifyToken(
        refreshTokenValue,
        env.jwt.refreshSecret
      ) as JwtPayload;

    const tokenHash =
      hashToken(
        refreshTokenValue
      );

    const storedToken =
      await RefreshToken.findOne({
        tokenHash,
      });

    if (
      !storedToken ||
      storedToken.revoked
    ) {
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid refresh token"
      );
    }

    storedToken.revoked = true;

    await storedToken.save();

    const payload: JwtPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    const accessToken =
      generateAccessToken(
        payload
      );

    const newRefreshToken =
      generateRefreshToken(
        payload
      );

    const refreshDecoded =
      jwt.decode(
        newRefreshToken
      ) as {
        exp: number;
      };

    await RefreshToken.create({
      userId: decoded.userId,

      tokenHash:
        hashToken(
          newRefreshToken
        ),

      expiresAt:
        new Date(
          refreshDecoded.exp *
            1000
        ),
    });

    return {
      accessToken,
      refreshToken:
        newRefreshToken,
    };
  };

  const logout = async (
  refreshTokenValue: string
) => {
  const tokenHash =
    hashToken(
      refreshTokenValue
    );

  await RefreshToken.findOneAndUpdate(
    { tokenHash },
    { revoked: true }
  );
};

export const AuthService = {
  register,
  login,
  refreshToken,
  logout,
};