import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../utils/apiError';
import { HTTP_STATUS } from '../constraints/httpStatus';
import { AuthUser} from '../constraints/user';
import { UserRole } from '../constraints/userRole';
import { JwtPayload, verifyToken } from '../utils/auth.utils';

 
// interface AccessTokenPayload {
//   userID: string;
//   email: string;
//   role: UserRole;
//   type: 'access';
// }
 
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
 
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing or invalid Authorization header');
  }
 
  const token = header.slice('Bearer '.length).trim();
 
  try {
    const payload = verifyToken(token, env.jwt.accessSecret) as JwtPayload;
 
    // if (payload.type !== 'access') {
    //   throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token type');
    // }
 
    const user: AuthUser = { userId: payload.userId, email: payload.email, role: payload.role };
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Access token expired');
    }
    if (err instanceof AppError) throw err;
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid access token');
  }
}