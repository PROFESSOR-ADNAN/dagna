import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { RegisterSchema, LoginSchema } from '@dagna/shared';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { env } from '../config/env.js';
import { EmailService } from '../services/email.service.js';
import { SmsService } from '../services/sms.service.js';
import { User } from '../models/User.js';

const REFRESH_COOKIE_NAME = 'dagna_refresh';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterSchema.parse(req.body);
      const user = await AuthService.register(validated);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        user: {
          id: user._id,
          handle: user.handle,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          phone: user.phone,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginSchema.parse(req.body);
      const meta = {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      const { user, accessToken, rawRefreshToken } = await AuthService.login(
        validated.emailOrHandle,
        validated.password,
        validated.totpCode,
        meta
      );

      res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user._id,
          handle: user.handle,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          rating: user.rating,
          isMfaEnabled: user.isMfaEnabled,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          phone: user.phone,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!rawRefreshToken) {
        res.status(401).json({ success: false, message: 'Missing refresh token' });
        return;
      }

      const { accessToken, rawRefreshToken: newRefresh, user } = await AuthService.refresh(rawRefreshToken);

      res.cookie(REFRESH_COOKIE_NAME, newRefresh, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefresh,
        user: {
          id: user._id,
          handle: user.handle,
          displayName: user.displayName,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await AuthService.logout(rawRefreshToken);
      res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      user: {
        id: req.user?._id,
        handle: req.user?.handle,
        displayName: req.user?.displayName,
        email: req.user?.email,
        role: req.user?.role,
        rating: req.user?.rating,
        solvedCount: req.user?.solvedCount,
        isMfaEnabled: req.user?.isMfaEnabled,
        isEmailVerified: req.user?.isEmailVerified,
        isPhoneVerified: req.user?.isPhoneVerified,
        phone: req.user?.phone,
      },
    });
  }

  static async sendEmailCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (req.user.isEmailVerified) {
        res.status(400).json({ success: false, message: 'Email is already verified' });
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      req.user.emailVerificationCode = code;
      req.user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await req.user.save();

      await EmailService.sendVerificationCode(req.user.email, code, req.user.handle);

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email address.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmailCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ success: false, message: '6-digit verification code is required' });
        return;
      }

      // Fetch user with select fields
      const user = await User.findById(req.user._id).select('+emailVerificationCode +emailVerificationExpires');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.emailVerificationCode || !user.emailVerificationExpires) {
        res.status(400).json({ success: false, message: 'No pending email verification code found. Please request a new one.' });
        return;
      }

      if (new Date() > user.emailVerificationExpires) {
        res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
        return;
      }

      if (user.emailVerificationCode.trim() !== code.trim()) {
        res.status(400).json({ success: false, message: 'Invalid verification code.' });
        return;
      }

      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email address verified successfully!',
        isEmailVerified: true,
      });
    } catch (err) {
      next(err);
    }
  }

  static async sendPhoneCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const phoneInput = req.body.phone || req.user.phone;
      if (!phoneInput || typeof phoneInput !== 'string') {
        res.status(400).json({ success: false, message: 'Valid phone number is required (e.g. 0912345678)' });
        return;
      }

      const normalizedPhone = SmsService.normalizePhoneNumber(phoneInput);
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      req.user.phone = normalizedPhone;
      req.user.phoneVerificationCode = code;
      req.user.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await req.user.save();

      const smsResult = await SmsService.sendVerificationOtp(normalizedPhone, code);
      if (!smsResult.success) {
        res.status(502).json({
          success: false,
          message: smsResult.error || 'Failed to send SMS verification code',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Verification code sent to ${normalizedPhone}`,
        phone: normalizedPhone,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyPhoneCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { code } = req.body;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ success: false, message: '6-digit verification code is required' });
        return;
      }

      const user = await User.findById(req.user._id).select('+phoneVerificationCode +phoneVerificationExpires');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
        res.status(400).json({ success: false, message: 'No pending phone verification code found. Please request a new one.' });
        return;
      }

      if (new Date() > user.phoneVerificationExpires) {
        res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
        return;
      }

      if (user.phoneVerificationCode.trim() !== code.trim()) {
        res.status(400).json({ success: false, message: 'Invalid verification code.' });
        return;
      }

      user.isPhoneVerified = true;
      user.phoneVerificationCode = undefined;
      user.phoneVerificationExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully!',
        isPhoneVerified: true,
      });
    } catch (err) {
      next(err);
    }
  }

  static async setupMfa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) return;
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(req.user.email, 'Dagna Online Judge', secret);
      const qrDataUrl = await qrcode.toDataURL(otpauth);

      req.user.totpSecret = secret;
      await req.user.save();

      res.status(200).json({
        success: true,
        secret,
        qrCode: qrDataUrl,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyMfa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      if (!req.user || !req.user.totpSecret) {
        res.status(400).json({ success: false, message: 'MFA setup not initialized' });
        return;
      }

      const isValid = authenticator.check(code, req.user.totpSecret);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Invalid verification code' });
        return;
      }

      req.user.isMfaEnabled = true;
      await req.user.save();

      res.status(200).json({ success: true, message: 'MFA successfully enabled' });
    } catch (err) {
      next(err);
    }
  }
}
