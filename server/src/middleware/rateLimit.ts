import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis.js';
import { AppError } from './errorHandler.js';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  failClosed?: boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix, failClosed = false } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Generate key based on Authenticated User ID if present, otherwise Client IP
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const identifier = (req as any).userId || clientIp;
    const redisKey = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      const redis = getRedisClient();
      const current = await redis.incr(redisKey);

      if (current === 1) {
        await redis.pexpire(redisKey, windowMs);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        next(new AppError('Too many requests, please slow down and retry later.', 429, 'https://dagna.dev/errors/rate-limit-exceeded'));
        return;
      }

      next();
    } catch (err) {
      if (failClosed) {
        next(new AppError('Security checkpoint unavailable, request rejected.', 503));
        return;
      }
      // Fail-open for general read paths if Redis is unreachable
      next();
    }
  };
}
