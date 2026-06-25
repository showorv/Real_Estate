import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../utils/apiError';
import { HTTP_STATUS } from '../constraints/httpStatus';
import { User } from '../constraints/user';
import { UserRole } from '../constraints/userRole';

 
interface AccessTokenPayload {
  userID: string;
  email: string;
  role: UserRole;
  type: 'access';
}
 
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
 
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing or invalid Authorization header');
  }
 
  const token = header.slice('Bearer '.length).trim();
 
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
 
    if (payload.type !== 'access') {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token type');
    }
 
    const user: User = { userId: payload.userID, email: payload.email, role: payload.role };
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