import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { RegisterSchema, LoginSchema } from '@dagna/shared';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { env } from '../config/env.js';

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
      },
    });
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
