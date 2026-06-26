import { Document, Types } from "mongoose";

export interface IRefreshToken
  extends Document {
  userId: Types.ObjectId;

  tokenHash: string;

  expiresAt: Date;

  revoked: boolean;
}