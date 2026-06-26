import { UserRole } from "./userRole";

export interface AuthUser {
    userId: string,
    email: string,
    role: UserRole
}