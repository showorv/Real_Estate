import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthService } from "./auth.service";
import { refreshTokenCookieOptions } from "../../utils/cookieConstant";
import { sendResponse } from "../../utils/sendResponse";
import { HTTP_STATUS } from "../../constraints/httpStatus";
import { IUser } from "../user/user.interface";
import { generateAccessToken, generateRefreshToken } from "../../utils/auth.utils";
import { env } from "../../config/env";
import { User } from "../user/user.model";

const register =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const result =
        await AuthService.register(
          req.body
        );

      res.cookie(
        "refreshToken",
        result.refreshToken,
        refreshTokenCookieOptions
      );

      sendResponse(res, {
        statusCode:
          HTTP_STATUS.CREATED,

        success: true,

        message:
          "Registration successful",

        data: {
          user: result.user,
          accessToken:
            result.accessToken,
        },
      });
    }
  );

  const login =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const { email,password, } = req.body;

      const result =
        await AuthService.login(
          email,
          password
        );

      res.cookie(
        "refreshToken",
        result.refreshToken,
        refreshTokenCookieOptions
      );

      sendResponse(res, {
        statusCode:
          HTTP_STATUS.OK,

        success: true,

        message:
          "Login successful",

        data: {
          user: result.user,
          accessToken:
            result.accessToken,
        },
      });
    }
  );


  const refreshToken =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const token = req.cookies.refreshToken;

      const result =
        await AuthService.refreshToken(
          token
        );

      res.cookie(
        "refreshToken",
        result.refreshToken,
        refreshTokenCookieOptions
      );

      sendResponse(res, {
        statusCode:
          HTTP_STATUS.OK,

        success: true,

        message:
          "Token refreshed",

        data: {
          accessToken:
            result.accessToken,
        },
      });
    }
  );

  const logout =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const token =req.cookies.refreshToken;

      if (token) {
        await AuthService.logout(
          token
        );
      }

      res.clearCookie(
        "refreshToken"
      );

      sendResponse(res, {
        statusCode:
          HTTP_STATUS.OK,

        success: true,

        message:
          "Logout successful",
      });
    }
  );


  const googleLogin =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const user =
        req.user as IUser;

      const payload = {
        userId:
          user._id.toString(),

        email:
          user.email,

        role:
          user.role,
      };

      const accessToken =
        generateAccessToken(
          payload
        );

      const refreshToken =
        generateRefreshToken(
          payload
        );

      res.cookie(
        "refreshToken",
        refreshToken,
        refreshTokenCookieOptions
      );

      const frontendUrl =
        `${env.frontendUrl}/oauth-success?token=${accessToken}`;

      res.redirect(
        frontendUrl
      );
    }
  );


  const session = asyncHandler(async (req, res) => {
    const userId = (req.user as any).userId;
  const user = await User.findById(userId).select("-password");

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: "Session retrieved successfully",
    data: 
      user
    
  });
});
  export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  googleLogin,
  session,
};