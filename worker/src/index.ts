import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OutboxRelayWorker } from './workers/outbox.worker.js';
import { DagnaScheduler } from './schedulers/scheduler.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dagna?replicaSet=rs0';

async function bootstrap() {
  console.log('[DAGNA-WORKER] Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('[DAGNA-WORKER] MongoDB connected.');

  const outboxWorker = new OutboxRelayWorker();
  const scheduler = new DagnaScheduler();

  outboxWorker.start();
  scheduler.start();

  const shutdown = async (sig: string) => {
    console.log(`[DAGNA-WORKER] Received ${sig}. Shutting down worker...`);
    outboxWorker.stop();
    scheduler.stop();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[DAGNA-WORKER] Fatal error:', err);
  process.exit(1);
});
