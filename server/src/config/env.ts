import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  JUDGE_GATEWAY_PORT: z.coerce.number().default(4001),
  JUDGE_GATEWAY_HOST: z.string().default('127.0.0.1'),
  WIREGUARD_INTERFACE_IP: z.string().default('10.100.0.1'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/dagna?replicaSet=rs0'),
  REDIS_URL: z.string().optional().default(''),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z.string().min(16).default('development_jwt_access_secret_key_minimum_length_32_bytes!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('development_jwt_refresh_secret_key_minimum_length_32_bytes!'),
  CURSOR_SIGNING_KEY: z.string().min(16).default('development_cursor_signing_secret_key_minimum_16_bytes!'),
  JUDGE_NODE_TOKEN: z.string().default('node_token_dev_secret_fencing_token_testing_only'),
  JUDGING_ENABLED: z.coerce.boolean().default(true),
  DOUBLE_JUDGE_CONTEST_AC: z.coerce.boolean().default(false),
  CHAPA_SECRET_KEY: z.string().optional().default(''),
  CHAPA_PUBLIC_KEY: z.string().optional().default(''),
  CHAPA_WEBHOOK_SECRET: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
