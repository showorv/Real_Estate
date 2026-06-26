import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";
import { HTTP_STATUS } from "../../constraints/httpStatus";

const getMe =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const user =
        await UserService.getMe(
          req.user!.userId
        );

      sendResponse(res, {
        statusCode:
          HTTP_STATUS.OK,

        success: true,

        message:
          "Profile retrieved",

        data:user
          
      });
    }
  );

  const updateMe =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const user =
        await UserService.updateMe(
          req.user!.userId,
          req.body
        );

      sendResponse(res, {
        statusCode:
          HTTP_STATUS.OK,

        success: true,

        message:
          "Profile updated",

        data:
        
            user
          
      });
    }
  );

  export const UserController = {
  getMe,
  updateMe,
};