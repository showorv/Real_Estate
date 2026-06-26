import { Document } from "mongoose";
import { UserRole } from "../../constraints/userRole";


export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;

  role: UserRole;

  provider: "credentials" | "google";

  isActive: boolean;

  lastLoginAt?: Date;

  comparePassword(
    plainPassword: string
  ): Promise<boolean>;
}