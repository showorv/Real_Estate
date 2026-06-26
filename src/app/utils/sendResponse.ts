import { Response } from "express";

interface TMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: TMeta;
}

export const sendResponse = <T>(
  res: Response,
  payload: TResponse<T>
) => {
  const { statusCode, success, message, data, meta } = payload;

  res.status(statusCode).json({
    success,
    message,
    meta,
    data,
  });
};