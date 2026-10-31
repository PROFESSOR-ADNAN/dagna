import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { ROLES, UserRole } from '@dagna/shared';
import { authenticator } from 'otplib';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async register(data: { email: string; handle: string; displayName: string; password: string }): Promise<IUser> {
    const existing = await User.findOne({
      $or: [{ email: data.email.toLowerCase() }, { handle: data.handle.toLowerCase() }],
    });

    if (existing) {
      if (existing.email === data.email.toLowerCase()) {
        throw new AppError('An account with this email already exists', 409);
      }
      throw new AppError('Handle is already claimed by another user', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await User.create({
      email: data.email.toLowerCase(),
      handle: data.handle.toLowerCase(),
      displayName: data.displayName,
      passwordHash,
      role: ROLES.USER,
      isEmailVerified: true, // Auto-verified in development, token flow ready for production
    });

    await AuditLog.create({
      action: 'user.registered',
      actorId: user._id,
      actorRole: user.role,
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: { email: user.email, handle: user.handle },
    });

    return user;
  }

  static async login(
    emailOrHandle: string,
    passwordPlain: string,
    totpCode?: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ user: IUser; accessToken: string; rawRefreshToken: string }> {
    const identifier = emailOrHandle.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: identifier }, { handle: identifier }],
    }).select('+passwordHash +totpSecret');

    // Prevent user enumeration: generic error message
    const invalidCredentialsError = new AppError('Invalid credentials provided', 401);

    if (!user) {
      throw invalidCredentialsError;
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account is temporarily locked. Please try again in ${waitMinutes} minutes.`, 429);
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      throw invalidCredentialsError;
    }

    // Check MFA if enabled or if user is admin/organizer
    if (user.isMfaEnabled || user.role === ROLES.ADMIN || user.role === ROLES.ORGANIZER) {
      if (user.isMfaEnabled && user.totpSecret) {
        if (!totpCode || !authenticator.check(totpCode, user.totpSecret)) {
          throw new AppError('Invalid or missing 6-digit MFA verification code', 401);
        }
      }
    }

    // Reset failed login attempts on success
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    await user.save();

    // Create session tokens
    const { accessToken, rawRefreshToken } = await this.generateTokenPair(user);

    await AuditLog.create({
      action: 'user.login',
      actorId: user._id,
      actorRole: user.role,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      resourceType: 'User',
      resourceId: user._id.toString(),
    });

    return { user, accessToken, rawRefreshToken };
  }

  static async generateTokenPair(
    user: IUser,
    existingFamilyId?: string
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const familyId = existingFamilyId || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      familyId,
      isUsed: false,
      expiresAt,
    });

    return { accessToken, rawRefreshToken };
  }

  static async refresh(rawRefreshToken: string): Promise<{ accessToken: string; rawRefreshToken: string; user: IUser }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const existing = await RefreshToken.findOne({ tokenHash });

    if (!existing) {
      throw new AppError('Invalid or unrecognized refresh token', 401);
    }

    // Reuse detection: If an already used refresh token is submitted, invalidate the ENTIRE token family!
    if (existing.isUsed) {
      await RefreshToken.deleteMany({ familyId: existing.familyId });
      throw new AppError('Security violation: refresh token reuse detected. All sessions revoked.', 401);
    }

    // Mark current token as used
    existing.isUsed = true;
    await existing.save();

    const user = await User.findById(existing.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Rotate: Issue new token pair retaining the familyId
    const { accessToken, rawRefreshToken: newRawRefresh } = await this.generateTokenPair(user, existing.familyId);

    return { accessToken, rawRefreshToken: newRawRefresh, user };
  }

  static async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await RefreshToken.deleteOne({ tokenHash });
  }

  static async logoutAll(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }
}
