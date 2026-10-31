import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { GroupMember } from '../models/Group.js';
import { AppError } from './errorHandler.js';
import { UserRole, GroupRole } from '@dagna/shared';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: UserRole;
}

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Missing or malformed Authorization header', 401, 'https://dagna.dev/errors/unauthorized'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

    // Strict security check: Always load user status from DB to ensure no deactivated/banned/role-changed user bypasses checks
    const user = await User.findById(decoded.userId);
    if (!user) {
      next(new AppError('User account associated with this token no longer exists', 401, 'https://dagna.dev/errors/unauthorized'));
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    next();
  } catch (err) {
    next(new AppError('Invalid, expired, or tampered access token', 401, 'https://dagna.dev/errors/unauthorized'));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.userRole) {
      next(new AppError('Authentication required', 401, 'https://dagna.dev/errors/unauthorized'));
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      next(new AppError('Forbidden: insufficient administrative permissions', 403, 'https://dagna.dev/errors/forbidden'));
      return;
    }

    next();
  };
}

export function requireGroupRole(...allowedRoles: GroupRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const groupId = req.params.groupId || req.body.groupId;
    if (!groupId) {
      next(new AppError('Group ID missing from request', 400));
      return;
    }

    if (!req.userId) {
      next(new AppError('Authentication required', 401));
      return;
    }

    // Admins bypass group role check
    if (req.userRole === 'admin') {
      next();
      return;
    }

    const membership = await GroupMember.findOne({ groupId, userId: req.userId });
    if (!membership || !allowedRoles.includes(membership.role)) {
      next(new AppError('Forbidden: you do not have permission in this group', 403));
      return;
    }

    next();
  };
}
