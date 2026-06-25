import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller so a thrown/rejected error is forwarded to
 * next() automatically. Without this, every single controller would need
 * its own try/catch — this is the DRY version of that.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}