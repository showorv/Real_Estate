import { Request, Response } from "express";
import { HTTP_STATUS } from "../constraints/httpStatus";



export const notFound = (
  req: Request,
  res: Response
) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};