import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

import { IUser } from "./user.interface";
import { UserRole } from "../../constraints/userRole";
import { CallbackWithoutResultAndOptionalError } from "mongoose";


const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    avatar: {
      type: String,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return ;
  

  this.password = await bcrypt.hash(
    this.password!,
    12
  );


});

userSchema.methods.comparePassword =
  async function (plainPassword: string) {
    return bcrypt.compare(
      plainPassword,
      this.password
    );
  };

  userSchema.index({ email: 1 });

  export const User = mongoose.model<IUser>(
  "User",
  userSchema
);