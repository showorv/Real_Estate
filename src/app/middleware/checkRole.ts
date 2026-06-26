import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constraints/httpStatus';
import { AppError } from '../utils/apiError';
import { UserRole } from '../constraints/userRole';


/**
 * Usage: router.post('/properties', requireAuth, requireRole('manager', 'admin'), handler)
 * Must run after requireAuth — relies on req.user being set.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return function (req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required before role check');
    }
    const userRole = (req.user as any).role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, `This action requires one of: ${allowedRoles.join(', ')}`);
    }
    next();
  };
}