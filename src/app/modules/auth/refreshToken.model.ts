import mongoose, { Schema } from "mongoose";

import { IRefreshToken } from "./auth.interface";

const refreshTokenSchema =
  new Schema<IRefreshToken>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },

      revoked: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

  refreshTokenSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

export const RefreshToken =
  mongoose.model<IRefreshToken>(
    "RefreshToken",
    refreshTokenSchema
  );