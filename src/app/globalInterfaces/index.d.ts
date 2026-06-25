import { UserRole } from "../constraints/userRole";


declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;

        email: string;

        role: UserRole;
      };
    }
  }
}

export {};