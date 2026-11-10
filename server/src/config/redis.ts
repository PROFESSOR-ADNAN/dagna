import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const commonOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    if (env.REDIS_URL) {
      redisClient = new Redis(env.REDIS_URL, commonOptions);
    } else {
      redisClient = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        ...commonOptions,
      });
    }

    redisClient.on('error', (err) => {
      // In development or test, log gracefully without crashing
      if (env.NODE_ENV !== 'test') {
        console.warn('Redis connection issue:', err.message);
      }
    });
  }
  return redisClient;
}
