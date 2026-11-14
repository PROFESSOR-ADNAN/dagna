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
  CHAPA_ENCRYPTION_KEY: z.string().optional().default(''),
  AFRO_MESSAGE_API_KEY: z.string().optional().default(''),
  AFRO_MESSAGE_API_URL: z.string().default('https://api.afromessage.com/api/send'),
  AFRO_MESSAGE_SENDER: z.string().optional().default(''),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Dagna Online Judge <iam.professor.adnan@gmail.com>'),
});

const rawEnv = {
  ...process.env,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  REDIS_URL: process.env.REDIS_URL || process.env.REDIS_URI,
  CHAPA_WEBHOOK_SECRET: process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_ENCRYPTION_KEY,
  AFRO_MESSAGE_API_KEY: process.env.AFRO_MESSAGE_API_KEY || process.env.SMS_API_KEY,
  AFRO_MESSAGE_API_URL: process.env.AFRO_MESSAGE_API_URL || process.env.SMS_API_URL,
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER,
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.MAIL_FROM,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('CRITICAL: Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
