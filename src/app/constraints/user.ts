import { UserRole } from "./userRole";

export interface User {
    userId: string,
    email: string,
    role: UserRole
}