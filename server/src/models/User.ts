import mongoose, { Document, Schema } from 'mongoose';
import { ROLES, UserRole } from '@dagna/shared';

export interface IUser extends Document {
  email: string;
  handle: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  rating: number;
  solvedCount: number;
  submissionCount: number;
  totpSecret?: string;
  isMfaEnabled: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never exposed in queries by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    rating: {
      type: Number,
      default: 1400,
      index: true,
    },
    solvedCount: {
      type: Number,
      default: 0,
      index: true,
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    totpSecret: {
      type: String,
      select: false,
    },
    isMfaEnabled: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
UserSchema.index({ rating: -1, solvedCount: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
